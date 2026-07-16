import type { AnswerBoard, AnswerField } from "../shared/database/schemas";

/** Public shape returned by GET /game/:groupId/questions.
 *
 * All answer-related fields are stripped.  Only the question surface is exposed.
 */
export interface PublicPiiQuestion {
    board: "PII";
    externalId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    shipping: string | null;
}

export interface PublicInvariantQuestion {
    board: "INVARIANT";
    externalId: string;
    items: string;
    tax: string;
    shipping: string;
    totalPrice: string;
}

export type PublicQuestion = PublicPiiQuestion | PublicInvariantQuestion;

export interface GameQuestionsResult {
    groupId: string;
    sessionId: string;
    startedAt: string;
    expiresAt: string;
    questions: PublicQuestion[];
}

export interface GameStatusResult {
    groupId: string;
    sessionId: string;
    status: "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
    startedAt: string;
    expiresAt: string;
    submittedAt: string | null;
    score: { totalPoints: number; correctCount: number; wrongCount: number } | null;
}

export interface SubmitAnswersResult {
    sessionId: string;
    expiresAt: string;
    /** Answers as stored (isCorrect=null, points=null until grading). */
    answers: {
        board: AnswerBoard;
        targetId: string;
        field: AnswerField;
        isCorrect: null;
        points: null;
        createdAt: string;
    }[];
}

export interface SubmitResult {
    groupId: string;
    sessionId: string;
    status: "SUBMITTED" | "EXPIRED";
    submittedAt: string;
    score: { totalPoints: number; correctCount: number; wrongCount: number };
}

/** Placeholder — currently unused; kept for future DI expansion. */
export interface GameServiceConfig {
    readonly db: import("mongodb").Db;
}
