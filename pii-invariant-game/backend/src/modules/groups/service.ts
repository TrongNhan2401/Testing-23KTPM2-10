import { randomUUID } from "node:crypto";
import { env } from "../../config/env";
import {
    GAME_SESSIONS_COLLECTION,
    GameSessionDoc,
    GroupDoc,
    GroupStatus
} from "../shared/database/schemas";
import {
    GameAlreadyStartedError,
    GroupAlreadySelectedError,
    GroupNotFoundError,
    QuestionDataMissingError,
    SessionOwnershipError
} from "./errors";
import { GroupsRepository } from "./repository";
import {
    calculateSelectionExpiry,
    generateSelectionToken
} from "./selection-token";
import {
    LobbyGroup,
    PublicGroup,
    SelectGroupResult,
    StartGameResult
} from "./types";

/**
 * Service layer.
 * All business rules for the lobby / group-selection feature live here.
 * This layer depends on the repository (Mongo access) and on the
 * domain errors. It knows nothing about HTTP, Express, or Zod.
 */
export class GroupsService {
    private readonly repo: GroupsRepository;

    constructor(repo: GroupsRepository) {
        this.repo = repo;
    }

    /** GET /api/v1/groups — minimal lobby list. */
    async listLobby(): Promise<LobbyGroup[]> {
        const docs = await this.repo.listAllSortedByGroupId();
        return docs.map((d) => ({
            groupId: d.groupId,
            name: d.name,
            status: d.status
        }));
    }

    /** GET /api/v1/groups/:groupId — current status + selection meta. */
    async getGroup(groupId: string): Promise<PublicGroup> {
        const doc = await this.repo.findByGroupId(groupId);
        if (!doc) {
            throw new GroupNotFoundError(groupId);
        }
        return this.toPublic(doc);
    }

    /**
     * POST /api/v1/groups/select
     * Atomic WAITING -> READY transition. Generates a selectionToken and
     * stamps its expiry. Returns the token, which the client must persist
     * (e.g. localStorage) to retain ownership across page refreshes.
     */
    async selectGroup(groupId: string): Promise<SelectGroupResult> {
        const selectionToken = generateSelectionToken();
        const expiresAt = calculateSelectionExpiry();

        const updated = await this.repo.selectAsReady(
            groupId,
            selectionToken,
            expiresAt
        );
        if (updated) {
            return {
                groupId: updated.groupId,
                status: updated.status,
                selectionToken,
                selectionExpiresAt: expiresAt.toISOString()
            };
        }

        // Precondition failed: either group does not exist or is not WAITING.
        const fresh = await this.repo.findByGroupId(groupId);
        if (!fresh) {
            throw new GroupNotFoundError(groupId);
        }
        throw new GroupAlreadySelectedError(groupId, fresh.status);
    }

    /**
     * POST /api/v1/groups/release
     * READY -> WAITING. Requires the caller to present the current
     * selectionToken as proof of session ownership.
     */
    async releaseGroup(
        groupId: string,
        selectionToken: string
    ): Promise<PublicGroup> {
        const updated = await this.repo.releaseToWaiting(
            groupId,
            selectionToken
        );
        if (updated) {
            return this.toPublic(updated);
        }

        // Conditional update failed. Diagnose why.
        const fresh = await this.repo.findByGroupId(groupId);
        if (!fresh) {
            throw new GroupNotFoundError(groupId);
        }
        if (fresh.status !== "READY") {
            throw new GameAlreadyStartedError(groupId, fresh.status);
        }
        if (fresh.selectionToken !== selectionToken) {
            throw new SessionOwnershipError();
        }
        // Should be unreachable.
        throw new GameAlreadyStartedError(groupId, fresh.status);
    }

    /**
     * POST /api/v1/game/start
     * READY -> PLAYING. Creates a GameSession with frozen snapshots of
     * the current active questions. The partial unique index ensures
     * only one IN_PROGRESS session per group.
     */
    async startGame(
        groupId: string,
        selectionToken: string
    ): Promise<StartGameResult> {
        // 1. Transition READY -> PLAYING atomically.
        const playing = await this.repo.markAsPlaying(
            groupId,
            selectionToken
        );
        if (!playing) {
            const fresh = await this.repo.findByGroupId(groupId);
            if (!fresh) {
                throw new GroupNotFoundError(groupId);
            }
            if (fresh.status !== "READY") {
                throw new GameAlreadyStartedError(groupId, fresh.status);
            }
            if (fresh.selectionToken !== selectionToken) {
                throw new SessionOwnershipError();
            }
            throw new GameAlreadyStartedError(groupId, fresh.status);
        }

        // 2. Read active questions (>= 1 required by the validator's minItems).
        const [piiDocs, invariantDocs] = await Promise.all([
            this.repo.findActivePiiQuestions(),
            this.repo.findActiveInvariantQuestions()
        ]);
        if (piiDocs.length === 0) {
            throw new QuestionDataMissingError("piiQuestions (no isActive=true)");
        }
        if (invariantDocs.length === 0) {
            throw new QuestionDataMissingError(
                "invariantQuestions (no isActive=true)"
            );
        }

        // 3. Build the GameSession document.
        const now = new Date();
        const startedAt = now;
        const durationSeconds = env.GAME_DURATION_SECONDS;
        const expiresAt = new Date(now.getTime() + durationSeconds * 1000);
        const sessionId = "gs_" + randomUUID().replace(/-/g, "");

        const sessionDoc: GameSessionDoc = {
            _id: undefined as unknown as GameSessionDoc["_id"], // let MongoDB generate
            sessionId,
            groupId,
            status: "IN_PROGRESS",
            startedAt,
            durationSeconds,
            expiresAt,
            submittedAt: null,
            clientStartedAt: null,
            clientSubmittedAt: null,
            piiSnapshot: piiDocs.map((d) =>
                GroupsRepository.piiSnapshotOf(d)
            ),
            invariantSnapshot: invariantDocs.map((d) =>
                GroupsRepository.invariantSnapshotOf(d)
            ),
            answers: [],
            score: null,
            version: 1,
            createdAt: now,
            updatedAt: now
        };

        // 4. Insert. The partial unique index is the actual race-safe guard.
        //    Translate the duplicate-key error into a domain error.
        try {
            await this.repo.insertGameSession(sessionDoc);
        } catch (err: unknown) {
            const e = err as { code?: number; message?: string };
            if (e && e.code === 11000) {
                throw new GameAlreadyStartedError(groupId, "PLAYING");
            }
            throw err;
        }

        return {
            groupId,
            status: "PLAYING" as GroupStatus,
            sessionId,
            startedAt: startedAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            durationSeconds
        };
    }

    /** Public projection — never leak passwordHash or secrets. */
    private toPublic(doc: GroupDoc): PublicGroup {
        return {
            groupId: doc.groupId,
            name: doc.name,
            status: doc.status,
            selectionToken: doc.selectionToken ?? null,
            selectionExpiresAt: doc.selectionExpiresAt
                ? doc.selectionExpiresAt.toISOString()
                : null,
            updatedAt: doc.updatedAt.toISOString()
        };
    }
}

export const GAME_SESSIONS_COLLECTION_NAME = GAME_SESSIONS_COLLECTION;
