import { Document, IndexDescription } from "mongodb";

export const PII_QUESTIONS_COLLECTION = "piiQuestions" as const;

export interface PiiQuestionDoc extends Document {
    _id: Document["_id"];
    externalId: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    shipping: string | null;
    correctNotes: boolean;
    correctShipping: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const piiQuestionsValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: [
            "externalId",
            "correctNotes",
            "correctShipping",
            "isActive",
            "createdAt",
            "updatedAt",
        ],
        properties: {
            _id: { bsonType: "objectId" },
            externalId: {
                bsonType: "string",
                minLength: 1,
                description: "Business identifier for the PII question",
            },
            fullName: {
                bsonType: ["string", "null"],
                maxLength: 200,
            },
            email: {
                bsonType: ["string", "null"],
                maxLength: 200,
            },
            phone: {
                bsonType: ["string", "null"],
                maxLength: 200,
            },
            address: {
                bsonType: ["string", "null"],
                maxLength: 200,
            },
            notes: {
                bsonType: ["string", "null"],
                maxLength: 200,
            },
            shipping: {
                bsonType: ["string", "null"],
                maxLength: 200,
            },
            correctNotes: {
                bsonType: "bool",
                description: "Reference answer for the notes field",
            },
            correctShipping: {
                bsonType: "bool",
                description: "Reference answer for the shipping field",
            },
            isActive: {
                bsonType: "bool",
                description: "Soft-disable flag for admin",
            },
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" },
        },
        additionalProperties: false,
    },
};

export const piiQuestionsIndexes: IndexDescription[] = [
    { key: { externalId: 1 }, name: "externalId_unique", unique: true },
    {
        key: { isActive: 1, externalId: 1 },
        name: "active_externalId_idx",
    },
];