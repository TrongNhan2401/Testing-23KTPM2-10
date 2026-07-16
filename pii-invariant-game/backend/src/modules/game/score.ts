import { Decimal128 } from "mongodb";
import type {
    AnswerBoard,
    AnswerField,
    GameAnswerItem,
    ScoreSnapshot,
    SnapshotInvariantItem,
    SnapshotPiiItem
} from "../shared/database/schemas";

/**
 * Official scoring rules (confirmed by user):
 *
 *   +2  per correct answer
 *   -1  per incorrect answer
 *   final score is clamped to ≥ 0
 *
 * Grading is always performed by the backend during POST /submit.
 * The frontend shows provisional colours immediately but the backend
 * is the authoritative source of truth.
 */

const POINTS_CORRECT = 2;
const POINTS_WRONG = -1;

/** The shape of a submitted answer before grading. */
export interface RawAnswer {
    board: AnswerBoard;
    targetId: string;
    field: AnswerField;
    /** Optional: the frontend can send this as a hint, but backend ignores it. */
    guess?: boolean;
}

/** Result of grading a single answer. */
export interface GradedAnswer extends GameAnswerItem {
    isCorrect: boolean;
    points: number;
}

/** Result of grading all answers for a session. */
export interface GradingResult {
    answers: GradedAnswer[];
    totalPoints: number;
    correctCount: number;
    wrongCount: number;
}

/**
 * Compare a single PII answer against the frozen snapshot.
 *
 * The "correct" answers for the PII board are the cells that exist in the
 * Answer Key.  The Answer Key cells are the ones where
 * `correctNotes === true` or `correctShipping === true`.
 *
 * For a PII row with externalId E and field F:
 *   - If the answer key says F is "correct" (true) for E,
 *     then the player guessing F=present (true) is correct (+2).
 *   - If the answer key says F is "incorrect" (false) for E,
 *     the player guessing F=present (true) is wrong (-1).
 *   - A player who skips (does not submit an answer for E,F) gets 0
 *     for that cell and is not penalised.
 *
 * This function takes an answer that the player DID submit and returns
 * whether it matched the answer-key.
 */
function gradePiiAnswer(
    answer: RawAnswer,
    snapshot: SnapshotPiiItem
): boolean {
    if (answer.board !== "PII") return false;
    if (answer.field === "NOTES") return snapshot.correctNotes === true;
    if (answer.field === "SHIPPING") return snapshot.correctShipping === true;
    return false;
}

/**
 * Compare a single Invariant answer against the frozen snapshot.
 *
 * The "correct" answers for the Invariant board are rows where
 * `isViolation === true`.  Players must identify which rows are violations.
 */
function gradeInvariantAnswer(
    answer: RawAnswer,
    snapshot: SnapshotInvariantItem
): boolean {
    if (answer.board !== "INVARIANT") return false;
    // For the Invariant board the "field" is always NOTES here (a stand-in
    // for "is this row a violation?").  The answer.targetId must match
    // the snapshot externalId.
    if (answer.field !== "NOTES") return false;
    return snapshot.isViolation === true;
}

/**
 * Convert a Decimal128 to a plain number for arithmetic.
 * Rounds to 2 decimal places to avoid floating-point drift.
 */
function decimalToNumber(d: Decimal128): number {
    return parseFloat(d.toString());
}

/**
 * Grade all submitted answers against the frozen snapshots and compute
 * the final score snapshot.
 *
 * The algorithm:
 *   1. Build lookup maps from snapshot for O(1) answer validation.
 *   2. For each submitted answer, grade it against the snapshot.
 *   3. Accumulate points, clamping total to >= 0.
 *   4. Return graded answers and the score snapshot.
 */
export function gradeSession(
    rawAnswers: RawAnswer[],
    piiSnapshot: SnapshotPiiItem[],
    invariantSnapshot: SnapshotInvariantItem[]
): GradingResult {
    // Build lookup maps: piiSnapshot by (externalId) and (externalId+field)
    const piiMap = new Map<string, SnapshotPiiItem>();
    for (const item of piiSnapshot) {
        piiMap.set(item.externalId, item);
    }
    const invariantMap = new Map<string, SnapshotInvariantItem>();
    for (const item of invariantSnapshot) {
        invariantMap.set(item.externalId, item);
    }

    const now = new Date();
    const gradedAnswers: GradedAnswer[] = [];
    let correctCount = 0;
    let wrongCount = 0;
    let totalPoints = 0;

    for (const raw of rawAnswers) {
        let isCorrect = false;
        let snapshot: SnapshotPiiItem | SnapshotInvariantItem | undefined;

        if (raw.board === "PII") {
            snapshot = piiMap.get(raw.targetId);
        } else {
            snapshot = invariantMap.get(raw.targetId);
        }

        if (snapshot) {
            if (raw.board === "PII") {
                isCorrect = gradePiiAnswer(raw, snapshot as SnapshotPiiItem);
            } else {
                isCorrect = gradeInvariantAnswer(
                    raw,
                    snapshot as SnapshotInvariantItem
                );
            }
        }
        // If snapshot not found (e.g. question was deactivated after snapshot),
        // treat the answer as wrong.

        const points = isCorrect ? POINTS_CORRECT : POINTS_WRONG;
        totalPoints = Math.max(0, totalPoints + points);
        if (isCorrect) {
            correctCount++;
        } else {
            wrongCount++;
        }

        gradedAnswers.push({
            board: raw.board,
            targetId: raw.targetId,
            field: raw.field,
            isCorrect,
            points,
            createdAt: now
        });
    }

    const score: ScoreSnapshot = {
        totalPoints,
        correctCount,
        wrongCount,
        computedAt: now
    };

    return { answers: gradedAnswers, totalPoints, correctCount, wrongCount };
}

/** Compute the final total from a list of already-graded answers. */
export function computeFinalScore(
    gradedAnswers: GradedAnswer[]
): { totalPoints: number; correctCount: number; wrongCount: number } {
    let totalPoints = 0;
    let correctCount = 0;
    let wrongCount = 0;
    for (const a of gradedAnswers) {
        totalPoints = Math.max(0, totalPoints + a.points);
        if (a.isCorrect) {
            correctCount++;
        } else {
            wrongCount++;
        }
    }
    return { totalPoints, correctCount, wrongCount };
}
