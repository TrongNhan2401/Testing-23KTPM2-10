// Typed errors thrown by the game module.
// The controller catches these and maps them to HTTP status codes.

export class GameNotFoundError extends Error {
    constructor(groupId: string) {
        super(`No active game session found for group: ${groupId}`);
        this.name = "GameNotFoundError";
    }
}

export class SessionOwnershipError extends Error {
    constructor() {
        super("Provided selectionToken does not match the stored session for this group");
        this.name = "SessionOwnershipError";
    }
}

export class GameAlreadyEndedError extends Error {
    constructor(
        groupId: string,
        currentStatus: string
    ) {
        super(
            `Game for group ${groupId} has already ended (status: ${currentStatus})`
        );
        this.name = "GameAlreadyEndedError";
    }
}

export class GameExpiredError extends Error {
    constructor(groupId: string, expiredAt: string) {
        super(`Game for group ${groupId} expired at ${expiredAt}`);
        this.name = "GameExpiredError";
    }
}

export class InvalidAnswerError extends Error {
    constructor(detail: string) {
        super(`Invalid answer: ${detail}`);
        this.name = "InvalidAnswerError";
    }
}
