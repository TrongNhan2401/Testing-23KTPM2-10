import { randomBytes } from "node:crypto";

/**
 * Generate a URL-safe random selection token.
 *
 * This is NOT a user credential. It only identifies which browser
 * currently "owns" a group in the lobby. Loss of this token does not
 * compromise data — the worst case is that the group stays in READY
 * status until the operator restarts the lobby or it expires naturally.
 */
export function generateSelectionToken(): string {
    return "st_" + randomBytes(24).toString("base64url");
}

/** Lifetime of a lobby session in seconds. After this the token is invalid. */
export const SELECTION_TOKEN_TTL_SECONDS = 60 * 60 * 4; // 4 hours

export function calculateSelectionExpiry(now: Date = new Date()): Date {
    return new Date(now.getTime() + SELECTION_TOKEN_TTL_SECONDS * 1000);
}
