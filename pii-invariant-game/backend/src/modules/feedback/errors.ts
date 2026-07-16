export class FeedbackError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "FeedbackError";
    }
}

export class FeedbackNotFoundError extends FeedbackError {
    constructor(id: string) {
        super(`Feedback not found: ${id}`);
        this.name = "FeedbackNotFoundError";
    }
}

export class DuplicateFeedbackError extends FeedbackError {
    constructor(sessionId: string) {
        super(`Feedback already submitted for session: ${sessionId}`);
        this.name = "DuplicateFeedbackError";
    }
}
