import { startSession } from "../shared/database/client";
import type {
    GameSessionDoc,
    GroupDoc
} from "../shared/database/schemas";
import { GameAlreadyEndedError, GameExpiredError, GameNotFoundError, SessionOwnershipError } from "./errors";
import { gradeSession, RawAnswer } from "./score";
import type {
    GameQuestionsResult,
    GameStatusResult,
    PublicInvariantQuestion,
    PublicPiiQuestion,
    SubmitAnswersResult,
    SubmitResult
} from "./types";
import { GameRepository } from "./repository";
import { GroupsRepository } from "../groups/repository";
import { LeaderboardRepository } from "../leaderboard/repository";

function toPublicPii(item: import("../shared/database/schemas").SnapshotPiiItem): PublicPiiQuestion {
    return {
        board: "PII",
        externalId: item.externalId,
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        address: item.address,
        notes: item.notes,
        shipping: item.shipping
    };
}

function toPublicInvariant(
    item: import("../shared/database/schemas").SnapshotInvariantItem
): PublicInvariantQuestion {
    return {
        board: "INVARIANT",
        externalId: item.externalId,
        items: item.items.toString(),
        tax: item.tax.toString(),
        shipping: item.shipping.toString(),
        totalPrice: item.totalPrice.toString()
    };
}

function checkExpiry(session: GameSessionDoc): void {
    if (new Date() > session.expiresAt) {
        throw new GameExpiredError(
            session.groupId,
            session.expiresAt.toISOString()
        );
    }
}

function verifyOwnership(group: GroupDoc, selectionToken: string): void {
    if (group.selectionToken !== selectionToken) {
        throw new SessionOwnershipError();
    }
}

export class GameService {
    constructor(
        private readonly gameRepo: GameRepository,
        private readonly groupsRepo: GroupsRepository,
        private readonly leaderboardRepo: LeaderboardRepository
    ) {}

    async getQuestions(
        groupId: string,
        selectionToken: string
    ): Promise<GameQuestionsResult> {
        const anySession = await this.gameRepo.findSessionByGroupId(groupId);
        if (!anySession) {
            throw new GameNotFoundError(groupId);
        }

        const session = await this.gameRepo.findActiveSession(groupId);
        if (!session) {
            throw new GameAlreadyEndedError(groupId, anySession.status);
        }

        await this.verifyOwnershipOrThrow(groupId, selectionToken, session);

        return {
            groupId: session.groupId,
            sessionId: session.sessionId,
            startedAt: session.startedAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            questions: [
                ...session.piiSnapshot.map(toPublicPii),
                ...session.invariantSnapshot.map(toPublicInvariant)
            ]
        };
    }

    async submitAnswers(
        groupId: string,
        selectionToken: string,
        rawAnswers: RawAnswer[]
    ): Promise<SubmitAnswersResult> {
        const anySession = await this.gameRepo.findSessionByGroupId(groupId);
        if (!anySession) {
            throw new GameNotFoundError(groupId);
        }

        const session = await this.gameRepo.findActiveSession(groupId);
        if (!session) {
            throw new GameAlreadyEndedError(groupId, anySession.status);
        }

        await this.verifyOwnershipOrThrow(groupId, selectionToken, session);

        if (session.status !== "IN_PROGRESS") {
            throw new GameAlreadyEndedError(groupId, session.status);
        }

        checkExpiry(session);

        const now = new Date();
        const answerItems = rawAnswers.map((raw) => ({
            board: raw.board,
            targetId: raw.targetId,
            field: raw.field,
            isCorrect: null,
            points: null,
            createdAt: now
        }));

        await this.gameRepo.upsertAnswers(session.sessionId, answerItems);

        return {
            sessionId: session.sessionId,
            expiresAt: session.expiresAt.toISOString(),
            answers: answerItems.map((a) => ({
                board: a.board,
                targetId: a.targetId,
                field: a.field,
                isCorrect: null,
                points: null,
                createdAt: a.createdAt.toISOString()
            }))
        };
    }

    async submitGame(
        groupId: string,
        selectionToken: string,
        clientSubmittedAt: Date | null
    ): Promise<SubmitResult> {
        // Check for any session first (including non-active ones) to distinguish
        // "session doesn't exist" (404) from "session already submitted/expired" (409).
        const anySession = await this.gameRepo.findSessionByGroupId(groupId);
        if (!anySession) {
            throw new GameNotFoundError(groupId);
        }

        const session = await this.gameRepo.findActiveSession(groupId);
        if (!session) {
            // Session exists but is not IN_PROGRESS → already ended.
            throw new GameAlreadyEndedError(groupId, anySession.status);
        }

        await this.verifyOwnershipOrThrow(groupId, selectionToken, session);

        if (session.status !== "IN_PROGRESS") {
            throw new GameAlreadyEndedError(groupId, session.status);
        }

        const now = new Date();
        const isExpired = now > session.expiresAt;

        const rawAnswers: RawAnswer[] = session.answers.map((a) => ({
            board: a.board,
            targetId: a.targetId,
            field: a.field
        }));

        const gradingResult = gradeSession(
            rawAnswers,
            session.piiSnapshot,
            session.invariantSnapshot
        );

        const scoreSnapshot = {
            totalPoints: gradingResult.totalPoints,
            correctCount: gradingResult.correctCount,
            wrongCount: gradingResult.wrongCount,
            computedAt: now
        };

        // ── MongoDB transaction ─────────────────────────────────────────────
        const mongoSession = startSession();

        try {
            await mongoSession.withTransaction(
                async () => {
                    if (isExpired) {
                        const { session: expiredSession } =
                            await this.gameRepo.transitionToExpired(
                                session.sessionId,
                                groupId,
                                selectionToken,
                                mongoSession
                            );
                        if (!expiredSession) {
                            throw new GameAlreadyEndedError(groupId, "EXPIRED");
                        }
                    } else {
                        const updatedSession =
                            await this.gameRepo.transitionToSubmitted(
                                session.sessionId,
                                gradingResult.answers,
                                scoreSnapshot,
                                clientSubmittedAt,
                                mongoSession
                            );

                        if (!updatedSession) {
                            throw new GameAlreadyEndedError(groupId, "SUBMITTED");
                        }

                        const updatedGroup =
                            await this.gameRepo.transitionGroupToFinished(
                                groupId,
                                selectionToken,
                                mongoSession
                            );

                        if (!updatedGroup) {
                            throw new GameAlreadyEndedError(groupId, "FINISHED");
                        }

                        await this.leaderboardRepo.upsertScore(
                            groupId,
                            session.sessionId,
                            gradingResult.totalPoints,
                            now,
                            mongoSession
                        );
                    }
                },
                {
                    readPreference: "primary",
                    readConcern: { level: "majority" },
                    writeConcern: { w: "majority" }
                }
            );
        } catch (err: unknown) {
            const e = err as { code?: number; message?: string };
            if (
                e &&
                (e.code === 20 ||
                    (typeof e.message === "string" &&
                        e.message.includes(
                            "Transaction numbers are only allowed on a replica set member or mongos"
                        )))
            ) {
                const msg =
                    "[game] MongoDB transactions are not supported. " +
                    "Submit requires transactions. Stopping the operation.";
                // eslint-disable-next-line no-console
                console.error(msg);
                throw new Error(msg);
            }
            throw err;
        } finally {
            await mongoSession.endSession();
        }

        return {
            groupId,
            sessionId: session.sessionId,
            status: isExpired ? "EXPIRED" : "SUBMITTED",
            submittedAt: now.toISOString(),
            score: {
                totalPoints: gradingResult.totalPoints,
                correctCount: gradingResult.correctCount,
                wrongCount: gradingResult.wrongCount
            }
        };
    }

    async getGameStatus(groupId: string): Promise<GameStatusResult> {
        const session = await this.gameRepo.findSessionByGroupId(groupId);
        if (!session) {
            throw new GameNotFoundError(groupId);
        }

        return {
            groupId: session.groupId,
            sessionId: session.sessionId,
            status: session.status,
            startedAt: session.startedAt.toISOString(),
            expiresAt: session.expiresAt.toISOString(),
            submittedAt: session.submittedAt
                ? session.submittedAt.toISOString()
                : null,
            score: session.score
                ? {
                      totalPoints: session.score.totalPoints,
                      correctCount: session.score.correctCount,
                      wrongCount: session.score.wrongCount
                  }
                : null
        };
    }

    private async verifyOwnershipOrThrow(
        groupId: string,
        selectionToken: string,
        _session: GameSessionDoc
    ): Promise<void> {
        const group = await this.groupsRepo.findByGroupId(groupId);
        if (!group) {
            throw new GameNotFoundError(groupId);
        }

        if (group.status !== "PLAYING") {
            throw new GameAlreadyEndedError(groupId, group.status);
        }

        verifyOwnership(group, selectionToken);
    }
}
