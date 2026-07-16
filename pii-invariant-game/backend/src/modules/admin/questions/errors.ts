export class QuestionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "QuestionError";
    }
}

export class QuestionNotFoundError extends QuestionError {
    constructor(externalId: string) {
        super(`Question not found: ${externalId}`);
        this.name = "QuestionNotFoundError";
    }
}

export class DuplicateQuestionError extends QuestionError {
    constructor(externalId: string) {
        super(`Question already exists: ${externalId}`);
        this.name = "DuplicateQuestionError";
    }
}
