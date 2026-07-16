import { Collection, Db, Filter, FindOptions } from "mongodb";
import {
    GAME_SESSIONS_COLLECTION,
    GameSessionDoc,
    GroupDoc,
    GROUPS_COLLECTION,
    InvariantQuestionDoc,
    INVARIANT_QUESTIONS_COLLECTION,
    PII_QUESTIONS_COLLECTION,
    PiiQuestionDoc,
    SnapshotInvariantItem,
    SnapshotPiiItem
} from "../shared/database/schemas";

/**
 * Repository layer.
 * This module is the ONLY place in the groups feature that touches MongoDB.
 * No business rules here. No HTTP concerns. No token generation here.
 *
 * Returned documents are typed; the service decides what to do with them.
 */
export class GroupsRepository {
    private readonly groups: Collection<GroupDoc>;
    private readonly piiQuestions: Collection<PiiQuestionDoc>;
    private readonly invariantQuestions: Collection<InvariantQuestionDoc>;
    private readonly gameSessions: Collection<GameSessionDoc>;

    constructor(db: Db) {
        this.groups = db.collection<GroupDoc>(GROUPS_COLLECTION);
        this.piiQuestions = db.collection<PiiQuestionDoc>(
            PII_QUESTIONS_COLLECTION
        );
        this.invariantQuestions = db.collection<InvariantQuestionDoc>(
            INVARIANT_QUESTIONS_COLLECTION
        );
        this.gameSessions = db.collection<GameSessionDoc>(
            GAME_SESSIONS_COLLECTION
        );
    }

    findByGroupId(groupId: string): Promise<GroupDoc | null> {
        return this.groups.findOne({ groupId } as Filter<GroupDoc>);
    }

    async listAllSortedByGroupId(): Promise<GroupDoc[]> {
        const cursor = this.groups
            .find({}, { projection: { passwordHash: 0 } } as FindOptions)
            .sort({ groupId: 1 });
        return cursor.toArray();
    }

    /**
     * Atomically mark a WAITING group as READY and store a new selection token.
     * Returns the updated document if the conditional update succeeded,
     * or `null` if the group did not satisfy the precondition
     * (not found, or not currently WAITING).
     *
     * The conditional filter makes this safe under concurrent requests.
     */
    async selectAsReady(
        groupId: string,
        selectionToken: string,
        selectionExpiresAt: Date
    ): Promise<GroupDoc | null> {
        const now = new Date();
        const result = await this.groups.findOneAndUpdate(
            { groupId, status: "WAITING" } as Filter<GroupDoc>,
            {
                $set: {
                    status: "READY",
                    selectionToken,
                    selectionExpiresAt,
                    updatedAt: now
                }
            },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    /**
     * Atomically mark a READY group as WAITING and clear the selection token.
     * `expectedSelectionToken` must match the stored token (session ownership check).
     * Returns the updated document on success, `null` on precondition failure.
     */
    async releaseToWaiting(
        groupId: string,
        expectedSelectionToken: string
    ): Promise<GroupDoc | null> {
        const now = new Date();
        const result = await this.groups.findOneAndUpdate(
            {
                groupId,
                status: "READY",
                selectionToken: expectedSelectionToken
            } as Filter<GroupDoc>,
            {
                $set: {
                    status: "WAITING",
                    selectionToken: null,
                    selectionExpiresAt: null,
                    updatedAt: now
                }
            },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    /**
     * Atomically mark a READY group as PLAYING and bump updatedAt.
     * `expectedSelectionToken` must match the stored token (session ownership check).
     * Returns the updated document on success, `null` on precondition failure.
     */
    async markAsPlaying(
        groupId: string,
        expectedSelectionToken: string
    ): Promise<GroupDoc | null> {
        const now = new Date();
        const result = await this.groups.findOneAndUpdate(
            {
                groupId,
                status: "READY",
                selectionToken: expectedSelectionToken
            } as Filter<GroupDoc>,
            {
                $set: {
                    status: "PLAYING",
                    updatedAt: now
                }
            },
            { returnDocument: "after" }
        );
        return result ?? null;
    }

    /**
     * Read all active PII questions, sorted by externalId ascending.
     */
    async findActivePiiQuestions(): Promise<PiiQuestionDoc[]> {
        return this.piiQuestions
            .find({ isActive: true } as Filter<PiiQuestionDoc>)
            .sort({ externalId: 1 })
            .toArray();
    }

    /**
     * Read all active Invariant questions, sorted by externalId ascending.
     */
    async findActiveInvariantQuestions(): Promise<InvariantQuestionDoc[]> {
        return this.invariantQuestions
            .find({ isActive: true } as Filter<InvariantQuestionDoc>)
            .sort({ externalId: 1 })
            .toArray();
    }

    /**
     * Build a deterministic snapshot for a PII question.
     * Snapshot includes all fields the validator requires.
     */
    static piiSnapshotOf(doc: PiiQuestionDoc): SnapshotPiiItem {
        return {
            externalId: doc.externalId,
            fullName: doc.fullName ?? null,
            email: doc.email ?? null,
            phone: doc.phone ?? null,
            address: doc.address ?? null,
            notes: doc.notes ?? null,
            shipping: doc.shipping ?? null,
            correctNotes: doc.correctNotes,
            correctShipping: doc.correctShipping
        };
    }

    static invariantSnapshotOf(
        doc: InvariantQuestionDoc
    ): SnapshotInvariantItem {
        return {
            externalId: doc.externalId,
            items: doc.items,
            tax: doc.tax,
            shipping: doc.shipping,
            totalPrice: doc.totalPrice,
            isViolation: doc.isViolation
        };
    }

    /**
     * Insert a new GameSession.
     * The existing partial unique index
     *   `groupId_one_open_session_unique` (groupId, status: IN_PROGRESS)
     * will throw MongoServerError code 11000 if a duplicate active session
     * is attempted. The service translates that into a domain error.
     */
    async insertGameSession(doc: GameSessionDoc): Promise<void> {
        await this.gameSessions.insertOne(doc);
    }

    /**
     * Returns the count of currently IN_PROGRESS game sessions for a group.
     * Used by the service as a secondary check before insert (best-effort;
     * the partial unique index is the actual race-safe guard).
     */
    async countInProgressSessionsForGroup(groupId: string): Promise<number> {
        return this.gameSessions.countDocuments({
            groupId,
            status: "IN_PROGRESS"
        } as Filter<GameSessionDoc>);
    }
}
