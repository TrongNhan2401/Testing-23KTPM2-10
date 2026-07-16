import type { GroupStatus } from "../shared/database/schemas";

export type { GroupStatus };

/** Public projection of a group. The validator and passwordHash are NOT exposed. */
export interface PublicGroup {
    groupId: string;
    name: string;
    status: GroupStatus;
    selectionToken: string | null;
    selectionExpiresAt: string | null; // ISO string
    updatedAt: string; // ISO string
}

/** Minimal projection used for GET /groups (lobby list). */
export interface LobbyGroup {
    groupId: string;
    status: GroupStatus;
    name: string;
}

/** Result of selecting a group. The selectionToken must be persisted by the client. */
export interface SelectGroupResult {
    groupId: string;
    status: GroupStatus;
    selectionToken: string;
    selectionExpiresAt: string;
}

/** Result of starting a game. */
export interface StartGameResult {
    groupId: string;
    status: GroupStatus;
    sessionId: string;
    startedAt: string;
    expiresAt: string;
    durationSeconds: number;
}
