import bcrypt from "bcryptjs";
import { Collection, Filter, UpdateFilter } from "mongodb";
import { ADMIN_USERS_COLLECTION, AdminUserDoc } from "../schemas";

export const DEFAULT_ADMIN_USERNAME = "admin";
export const DEFAULT_ADMIN_PASSWORD = "admin123";
const BCRYPT_ROUNDS = 10;

export interface SeedableAdmin {
    username: string;
    password: string;
}

export const SEED_ADMINS: SeedableAdmin[] = [
    {
        username: DEFAULT_ADMIN_USERNAME,
        password: DEFAULT_ADMIN_PASSWORD
    }
];

export interface SeedUpsertResult {
    matched: number;
    inserted: number;
    modified: number;
}

export async function seedAdminUsers(
    collection: Collection<AdminUserDoc>
): Promise<SeedUpsertResult> {
    const now = new Date();
    let matched = 0;
    let inserted = 0;
    let modified = 0;

    for (const a of SEED_ADMINS) {
        const passwordHash = await bcrypt.hash(a.password, BCRYPT_ROUNDS);
        const filter: Filter<AdminUserDoc> = { username: a.username };
        const update: UpdateFilter<AdminUserDoc> = {
            $setOnInsert: {
                username: a.username,
                passwordHash,
                role: "ADMIN",
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

export const ADMIN_USERS_SEED_COLLECTION = ADMIN_USERS_COLLECTION;