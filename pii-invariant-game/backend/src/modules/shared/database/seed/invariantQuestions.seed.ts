import { Collection, Decimal128, Filter, UpdateFilter } from "mongodb";
import {
    INVARIANT_QUESTIONS_COLLECTION,
    InvariantQuestionDoc
} from "../schemas";

export interface SeedableInvariantQuestion {
    externalId: string;
    items: string;
    tax: string;
    shipping: string;
    totalPrice: string;
    isViolation: boolean;
}

export const SEED_INVARIANT_QUESTIONS: SeedableInvariantQuestion[] = [
    {
        externalId: "#INV-01",
        items: "100.00",
        tax: "10.00",
        shipping: "5.00",
        totalPrice: "115.00",
        isViolation: false
    },
    {
        externalId: "#INV-02",
        items: "49.99",
        tax: "5.00",
        shipping: "3.00",
        totalPrice: "57.99",
        isViolation: false
    },
    {
        externalId: "#INV-03",
        items: "200.00",
        tax: "20.00",
        shipping: "10.00",
        totalPrice: "230.00",
        isViolation: false
    },
    {
        externalId: "#INV-04",
        items: "75.50",
        tax: "7.55",
        shipping: "0.00",
        totalPrice: "82.00",
        isViolation: true
    },
    {
        externalId: "#INV-05",
        items: "12.34",
        tax: "1.23",
        shipping: "2.50",
        totalPrice: "16.07",
        isViolation: false
    }
];

export interface SeedUpsertResult {
    matched: number;
    inserted: number;
    modified: number;
}

export async function seedInvariantQuestions(
    collection: Collection<InvariantQuestionDoc>
): Promise<SeedUpsertResult> {
    const now = new Date();
    let matched = 0;
    let inserted = 0;
    let modified = 0;

    for (const q of SEED_INVARIANT_QUESTIONS) {
        const filter: Filter<InvariantQuestionDoc> = {
            externalId: q.externalId
        };
        const update: UpdateFilter<InvariantQuestionDoc> = {
            $setOnInsert: {
                externalId: q.externalId,
                items: Decimal128.fromString(q.items),
                tax: Decimal128.fromString(q.tax),
                shipping: Decimal128.fromString(q.shipping),
                totalPrice: Decimal128.fromString(q.totalPrice),
                isViolation: q.isViolation,
                isActive: true,
                createdAt: now,
                updatedAt: now
            }
        };
        const res = await collection.updateOne(filter, update, { upsert: true });
        if (res.upsertedCount && res.upsertedCount > 0) inserted++;
        if (res.matchedCount && res.matchedCount > 0) matched++;
        if (res.modifiedCount && res.modifiedCount > 0) modified++;
    }

    return { matched, inserted, modified };
}

export const INVARIANT_QUESTIONS_SEED_COLLECTION =
    INVARIANT_QUESTIONS_COLLECTION;