import { Decimal128, Document, IndexDescription } from "mongodb";

export const GAME_SESSIONS_COLLECTION = "gameSessions" as const;

export type GameSessionStatus = "IN_PROGRESS" | "SUBMITTED" | "EXPIRED";
export type AnswerBoard = "PII" | "INVARIANT";
export type AnswerField = "NOTES" | "SHIPPING";

export interface SnapshotPiiItem {
    externalId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    shipping: string | null;
    correctNotes: boolean;
    correctShipping: boolean;
}

export interface SnapshotInvariantItem {
    externalId: string;
    items: Decimal128;
    tax: Decimal128;
    shipping: Decimal128;
    totalPrice: Decimal128;
    isViolation: boolean;
}

export interface GameAnswerItem {
    board: AnswerBoard;
    targetId: string;
    field: AnswerField;
    /** During POST /answer: null. Set by backend on POST /submit. */
    isCorrect: boolean | null;
    /** During POST /answer: null. Set by backend on POST /submit. */
    points: number | null;
    createdAt: Date;
}

export interface ScoreSnapshot {
    totalPoints: number;
    correctCount: number;
    wrongCount: number;
    computedAt: Date;
}

export interface GameSessionDoc extends Document {
    _id: Document["_id"];
    sessionId: string;
    groupId: string;
    status: GameSessionStatus;
    startedAt: Date;
    durationSeconds: number;
    expiresAt: Date;
    submittedAt: Date | null;
    clientStartedAt: Date | null;
    clientSubmittedAt: Date | null;

    piiSnapshot: SnapshotPiiItem[];
    invariantSnapshot: SnapshotInvariantItem[];

    answers: GameAnswerItem[];

    score: ScoreSnapshot | null;

    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export const gameSessionsValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: [
            "sessionId",
            "groupId",
            "status",
            "startedAt",
            "durationSeconds",
            "expiresAt",
            "piiSnapshot",
            "invariantSnapshot",
            "answers",
            "version",
            "createdAt",
            "updatedAt"
        ],
        properties: {
            _id: { bsonType: "objectId" },
            sessionId: {
                bsonType: "string",
                pattern: "^gs_[a-z0-9]{12,}$"
            },
            groupId: {
                bsonType: "string",
                pattern: "^Group(0[1-9]|10)$"
            },
            status: { enum: ["IN_PROGRESS", "SUBMITTED", "EXPIRED"] },
            startedAt: { bsonType: "date" },
            durationSeconds: {
                bsonType: "int",
                minimum: 1,
                maximum: 14400
            },
            expiresAt: { bsonType: "date" },
            submittedAt: { bsonType: ["date", "null"] },
            clientStartedAt: { bsonType: ["date", "null"] },
            clientSubmittedAt: { bsonType: ["date", "null"] },
            piiSnapshot: {
                bsonType: "array",
                minItems: 1,
                items: {
                    bsonType: "object",
                    required: ["externalId", "correctNotes", "correctShipping"],
                    properties: {
                        externalId: {
                            bsonType: "string",
                            pattern: "^#\\d{3,}$"
                        },
                        fullName: { bsonType: ["string", "null"] },
                        email: { bsonType: ["string", "null"] },
                        phone: { bsonType: ["string", "null"] },
                        address: { bsonType: ["string", "null"] },
                        notes: { bsonType: ["string", "null"] },
                        shipping: { bsonType: ["string", "null"] },
                        correctNotes: { bsonType: "bool" },
                        correctShipping: { bsonType: "bool" }
                    },
                    additionalProperties: false
                }
            },
            invariantSnapshot: {
                bsonType: "array",
                minItems: 1,
                items: {
                    bsonType: "object",
                    required: [
                        "externalId",
                        "items",
                        "tax",
                        "shipping",
                        "totalPrice",
                        "isViolation"
                    ],
                    properties: {
                        externalId: {
                            bsonType: "string",
                            pattern: "^#INV-\\d{2,}$"
                        },
                        items: { bsonType: "decimal" },
                        tax: { bsonType: "decimal" },
                        shipping: { bsonType: "decimal" },
                        totalPrice: { bsonType: "decimal" },
                        isViolation: { bsonType: "bool" }
                    },
                    additionalProperties: false
                }
            },
            answers: {
                bsonType: "array",
                items: {
                    bsonType: "object",
                    required: [
                        "board",
                        "targetId",
                        "field",
                        "createdAt"
                    ],
                    properties: {
                        board: { enum: ["PII", "INVARIANT"] },
                        targetId: { bsonType: "string" },
                        field: { enum: ["NOTES", "SHIPPING"] },
                        // isCorrect and points are null during POST /answer;
                        // set by the backend during POST /submit.
                        isCorrect: { bsonType: ["bool", "null"] },
                        points: { bsonType: ["int", "null"], minimum: -1 },
                        createdAt: { bsonType: "date" }
                    },
                    additionalProperties: false
                }
            },
            score: {
                bsonType: ["object", "null"],
                properties: {
                    totalPoints: { bsonType: "int", minimum: 0 },
                    correctCount: { bsonType: "int", minimum: 0 },
                    wrongCount: { bsonType: "int", minimum: 0 },
                    computedAt: { bsonType: "date" }
                }
            },
            version: { bsonType: "int", minimum: 1 },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" }
        }
    }
};

export const gameSessionsIndexes: IndexDescription[] = [
    { key: { sessionId: 1 }, name: "sessionId_unique", unique: true },
    { key: { groupId: 1, status: 1 }, name: "groupId_status_idx" },
    { key: { status: 1, expiresAt: 1 }, name: "status_expiresAt_idx" },
    {
        key: { "score.totalPoints": -1 },
        name: "score_totalPoints_desc_idx",
        sparse: true
    },
    {
        key: { groupId: 1 },
        name: "groupId_one_open_session_unique",
        unique: true,
        partialFilterExpression: { status: "IN_PROGRESS" }
    }
];
