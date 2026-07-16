import { Document, IndexDescription } from "mongodb";

export const INVARIANT_QUESTIONS_COLLECTION = "invariantQuestions" as const;

export interface InvariantQuestionDoc extends Document {
    _id: Document["_id"];
    externalId: string;
    items: import("mongodb").Decimal128;
    tax: import("mongodb").Decimal128;
    shipping: import("mongodb").Decimal128;
    totalPrice: import("mongodb").Decimal128;
    isViolation: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const invariantQuestionsValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: [
            "externalId",
            "items",
            "tax",
            "shipping",
            "totalPrice",
            "isViolation",
            "isActive",
            "createdAt",
            "updatedAt",
        ],
        properties: {
            _id: { bsonType: "objectId" },
            externalId: {
                bsonType: "string",
                minLength: 1,
                description: "Business identifier for the Invariant question",
            },
            items: { bsonType: "decimal", description: "Decimal128 required" },
            tax: { bsonType: "decimal", description: "Decimal128 required" },
            shipping: {
                bsonType: "decimal",
                description: "Decimal128 required",
            },
            totalPrice: {
                bsonType: "decimal",
                description: "Decimal128 required",
            },
            isViolation: {
                bsonType: "bool",
                description: "Whether this row violates an invariant",
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

export const invariantQuestionsIndexes: IndexDescription[] = [
    { key: { externalId: 1 }, name: "externalId_unique", unique: true },
    {
        key: { isActive: 1, externalId: 1 },
        name: "active_externalId_idx",
    },
];