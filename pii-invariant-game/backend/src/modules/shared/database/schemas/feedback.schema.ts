import { Document, IndexDescription } from "mongodb";

export const FEEDBACK_COLLECTION = "feedback" as const;

export interface FeedbackDoc extends Document {
    _id: Document["_id"];
    groupId: string | null;
    sessionId: string | null;
    rating: number;
    comment: string | null;
    createdAt: Date;
}

export const feedbackValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: ["rating", "createdAt"],
        properties: {
            _id: { bsonType: "objectId" },
            groupId: {
                bsonType: ["string", "null"],
            },
            sessionId: {
                bsonType: ["string", "null"],
            },
            rating: { bsonType: "int", minimum: 1, maximum: 5 },
            comment: {
                bsonType: ["string", "null"],
                maxLength: 1000
            },
            createdAt: { bsonType: "date" }
        },
        additionalProperties: false
    }
};

export const feedbackIndexes: IndexDescription[] = [
    {
        key: { sessionId: 1 },
        name: "sessionId_unique_sparse",
        unique: true,
        sparse: true
    },
    { key: { groupId: 1, createdAt: -1 }, name: "groupId_createdAt_idx" }
];