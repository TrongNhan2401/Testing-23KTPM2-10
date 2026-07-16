// Typed errors thrown by the groups module.
// The controller catches these and maps them to HTTP status codes.
// They are domain errors, not transport errors.

export class GroupNotFoundError extends Error {
    constructor(groupId: string) {
        super(`Group not found: ${groupId}`);
        this.name = "GroupNotFoundError";
    }
}

export class GroupAlreadySelectedError extends Error {
    constructor(groupId: string, currentStatus: string) {
        super(
            `Group ${groupId} cannot be selected because it is currently ${currentStatus}`
        );
        this.name = "GroupAlreadySelectedError";
    }
}

export class GameAlreadyStartedError extends Error {
    constructor(groupId: string, currentStatus: string) {
        super(
            `Group ${groupId} is in status ${currentStatus} and cannot be released or restarted`
        );
        this.name = "GameAlreadyStartedError";
    }
}

export class SessionOwnershipError extends Error {
    constructor() {
        super("Provided selectionToken does not match the stored session for the group");
        this.name = "SessionOwnershipError";
    }
}

export class QuestionDataMissingError extends Error {
    constructor(missing: string) {
        super(`Required question data is missing: ${missing}`);
        this.name = "QuestionDataMissingError";
    }
}
