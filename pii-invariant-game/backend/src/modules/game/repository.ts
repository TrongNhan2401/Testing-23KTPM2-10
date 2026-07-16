import {
    ClientSession,
    Collection,
    Db,
    Filter,
    FindOneAndUpdateOptions,
    UpdateFilter
} from "mongodb";
import {
    GAME_SESSIONS_COLLECTION,
    GameAnswerItem,
    GameSessionDoc,
    GroupDoc,
    GROUPS_COLLECTION,
    ScoreSnapshot
} from "../shared/database/schemas";

/**
 * Repository layer for the game module.
 *
 * This module is the ONLY place that touches the gameSessions and groups
 * collections for gameplay operations.  No business rules here.
 *
 * Repository methods accept an optional ClientSession parameter.
 * When provided, all MongoDB calls within that operation use it,
 * enabling participation in the caller's transaction.
 */
export class GameRepository {
    private readonly gameSessions: Collection<GameSessionDoc>;
    private readonly groups: Collection<GroupDoc>;

    constructor(db: Db) {
        this.gameSessions = db.collection<GameSessionDoc>(
            GAME_SESSIONS_COLLECTION
        );
        this.groups = db.collection<GroupDoc>(GROUPS_COLLECTION);
    }

    // ─────────────────────────────────────────────────────────────────
    // Read
    // ─────────────────────────────────────────────────────────────────

    async findActiveSession(
        groupId: string
    ): Promise<GameSessionDoc | null> {
        return this.gameSessions.findOne({
            groupId,
            status: "IN_PROGRESS"
        } as Filter<GameSessionDoc>);
    }

    async findSessionByGroupId(
        groupId: string
    ): Promise<GameSessionDoc | null> {
        return this.gameSessions.findOne({
            groupId
        } as Filter<GameSessionDoc>);
    }

    // ─────────────────────────────────────────────────────────────────
    // Answers
    //
    // Upserts each answer into session.answers using findOneAndUpdate
    // with array filters so repeated calls for the same (board, targetId, field)
    // update rather than duplicate.
    //
    // isCorrect and points are always null here; filled in by /submit.
    // ─────────────────────────────────────────────────────────────────

    async upsertAnswers(
        sessionId: string,
        answers: GameAnswerItem[],
        mongoSession?: ClientSession
    ): Promise<void> {
        const sessionOpts: FindOneAndUpdateOptions = mongoSession
            ? { session: mongoSession }
            : {};
        const updateOpts: FindOneAndUpdateOptions = mongoSession
            ? { session: mongoSession }
            : {};

        for (const answer of answers) {
            // Try to push (only if not already present).
            const pushResult = await this.gameSessions.findOneAndUpdate(
                {
                    sessionId,
                    status: "IN_PROGRESS",
                    "answers": {
                        $not: {
                            $elemMatch: {
                                board: answer.board,
                                targetId: answer.targetId,
                                field: answer.field
                            }
                        }
                    }
                } as Filter<GameSessionDoc>,
                {
                    $push: { answers: { $each: [answer] } },
                    $set: { updatedAt: new Date() }
                } as unknown as UpdateFilter<GameSessionDoc>,
                sessionOpts
            );

            // If push matched nothing, the answer already exists — update it.
            if (!pushResult) {
                await this.gameSessions.updateOne(
                    {
                        sessionId,
                        status: "IN_PROGRESS",
                        "answers.board": answer.board,
                        "answers.targetId": answer.targetId,
                        "answers.field": answer.field
                    } as Filter<GameSessionDoc>,
                    {
                        $set: {
                            "answers.$": answer,
                            updatedAt: new Date()
                        }
                    },
                    updateOpts
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Submit — IN_PROGRESS → SUBMITTED
    // MUST be called inside a MongoDB transaction.
    // ─────────────────────────────────────────────────────────────────

    async transitionToSubmitted(
        sessionId: string,
        gradedAnswers: GameAnswerItem[],
        score: ScoreSnapshot,
        clientSubmittedAt: Date | null,
        mongoSession: ClientSession
    ): Promise<GameSessionDoc | null> {
        const now = new Date();
        const result = await this.gameSessions.findOneAndUpdate(
            {
                sessionId,
                status: "IN_PROGRESS"
            } as Filter<GameSessionDoc>,
            {
                $set: {
                    answers: gradedAnswers,
                    score,
                    status: "SUBMITTED",
                    submittedAt: now,
                    clientSubmittedAt,
                    updatedAt: now
                }
            },
            { returnDocument: "after", session: mongoSession }
        );
        return result ?? null;
    }

    /**
     * Transition group PLAYING → FINISHED.
     * MUST be called inside the same transaction as transitionToSubmitted.
     */
    async transitionGroupToFinished(
        groupId: string,
        expectedToken: string,
        mongoSession: ClientSession
    ): Promise<GroupDoc | null> {
        const now = new Date();
        const result = await this.groups.findOneAndUpdate(
            {
                groupId,
                status: "PLAYING",
                selectionToken: expectedToken
            } as Filter<GroupDoc>,
            {
                $set: {
                    status: "FINISHED",
                    selectionToken: null,
                    selectionExpiresAt: null,
                    updatedAt: now
                }
            },
            { returnDocument: "after", session: mongoSession }
        );
        return result ?? null;
    }

    // ─────────────────────────────────────────────────────────────────
    // Expire — IN_PROGRESS → EXPIRED + PLAYING → FINISHED
    // MUST be called inside a MongoDB transaction.
    // ─────────────────────────────────────────────────────────────────

    async transitionToExpired(
        sessionId: string,
        groupId: string,
        expectedToken: string,
        mongoSession: ClientSession
    ): Promise<{ session: GameSessionDoc | null; group: GroupDoc | null }> {
        const now = new Date();

        const [sessionResult, groupResult] = await Promise.all([
            this.gameSessions.findOneAndUpdate(
                {
                    sessionId,
                    status: "IN_PROGRESS"
                } as Filter<GameSessionDoc>,
                {
                    $set: {
                        status: "EXPIRED",
                        updatedAt: now
                    }
                },
                { returnDocument: "after", session: mongoSession }
            ),
            this.groups.findOneAndUpdate(
                {
                    groupId,
                    status: "PLAYING",
                    selectionToken: expectedToken
                } as Filter<GroupDoc>,
                {
                    $set: {
                        status: "FINISHED",
                        selectionToken: null,
                        selectionExpiresAt: null,
                        updatedAt: now
                    }
                },
                { returnDocument: "after", session: mongoSession }
            )
        ]);

        return {
            session: sessionResult ?? null,
            group: groupResult ?? null
        };
    }
}
