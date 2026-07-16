import { Collection, Filter, UpdateFilter } from "mongodb";
import { PII_QUESTIONS_COLLECTION, PiiQuestionDoc } from "../schemas";

export interface SeedablePiiQuestion {
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

export const SEED_PII_QUESTIONS: SeedablePiiQuestion[] = [
    {
        externalId: "#001",
        fullName: "Alice Nguyen",
        email: "alice@example.com",
        phone: "0901234567",
        address: "12 Le Loi, District 1, HCMC",
        notes: "Deliver before 5pm",
        shipping: "HCM-12 Le Loi",
        correctNotes: false,
        correctShipping: false
    },
    {
        externalId: "#002",
        fullName: "Bob Tran",
        email: "bob@example.com",
        phone: null,
        address: null,
        notes: "Gift wrap please",
        shipping: "HN-1 Trang Tien",
        correctNotes: false,
        correctShipping: false
    },
    {
        externalId: "#003",
        fullName: "Carol Le",
        email: null,
        phone: "0987654321",
        address: "5 Nguyen Hue",
        notes: null,
        shipping: null,
        correctNotes: true,
        correctShipping: true
    },
    {
        externalId: "#004",
        fullName: "Daniel Pham",
        email: "daniel@example.com",
        phone: "0351122334",
        address: "20 Ba Trieu",
        notes: "Call on arrival",
        shipping: "DN-20 Ba Trieu",
        correctNotes: false,
        correctShipping: false
    },
    {
        externalId: "#005",
        fullName: "Eve Hoang",
        email: null,
        phone: null,
        address: null,
        notes: null,
        shipping: null,
        correctNotes: true,
        correctShipping: true
    }
];

export interface SeedUpsertResult {
    matched: number;
    inserted: number;
    modified: number;
}

export async function seedPiiQuestions(
    collection: Collection<PiiQuestionDoc>
): Promise<SeedUpsertResult> {
    const now = new Date();
    let matched = 0;
    let inserted = 0;
    let modified = 0;

    for (const q of SEED_PII_QUESTIONS) {
        const filter: Filter<PiiQuestionDoc> = { externalId: q.externalId };
        const update: UpdateFilter<PiiQuestionDoc> = {
            $setOnInsert: {
                externalId: q.externalId,
                fullName: q.fullName,
                email: q.email,
                phone: q.phone,
                address: q.address,
                notes: q.notes,
                shipping: q.shipping,
                correctNotes: q.correctNotes,
                correctShipping: q.correctShipping,
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

export const PII_QUESTIONS_SEED_COLLECTION = PII_QUESTIONS_COLLECTION;