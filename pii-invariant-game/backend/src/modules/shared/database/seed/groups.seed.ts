import { Collection, Filter, UpdateFilter } from "mongodb";
import { GROUPS_COLLECTION, GroupDoc } from "../schemas";

export interface SeedableGroup {
    groupId: string;
    name: string;
}

export const SEED_GROUPS: SeedableGroup[] = [
    { groupId: "Group01", name: "Group 1" },
    { groupId: "Group02", name: "Group 2" },
    { groupId: "Group03", name: "Group 3" },
    { groupId: "Group04", name: "Group 4" },
    { groupId: "Group05", name: "Group 5" },
    { groupId: "Group06", name: "Group 6" },
    { groupId: "Group07", name: "Group 7" },
    { groupId: "Group08", name: "Group 8" },
    { groupId: "Group09", name: "Group 9" },
    { groupId: "Group10", name: "Group 10" }
];

const PLACEHOLDER_HASH =
    "$2a$10$placeholder.hash.not.a.real.password.set.by.seed";

export interface SeedUpsertResult {
    matched: number;
    inserted: number;
    modified: number;
}

export async function seedGroups(
    collection: Collection<GroupDoc>
): Promise<SeedUpsertResult> {
    const now = new Date();
    let matched = 0;
    let inserted = 0;
    let modified = 0;

    for (const g of SEED_GROUPS) {
        const filter: Filter<GroupDoc> = { groupId: g.groupId };
        const update: UpdateFilter<GroupDoc> = {
            $setOnInsert: {
                groupId: g.groupId,
                name: g.name,
                passwordHash: PLACEHOLDER_HASH,
                status: "WAITING",
                activeSessionId: null,
                selectionToken: null,
                selectionExpiresAt: null,
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

export const GROUPS_SEED_COLLECTION = GROUPS_COLLECTION;