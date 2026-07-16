import { Db, IndexDescription } from "mongodb";
import {
    ADMIN_USERS_COLLECTION,
    adminUsersIndexes,
    adminUsersValidator,
    FEEDBACK_COLLECTION,
    feedbackIndexes,
    feedbackValidator,
    GAME_SESSIONS_COLLECTION,
    gameSessionsIndexes,
    gameSessionsValidator,
    GROUPS_COLLECTION,
    groupsIndexes,
    groupsValidator,
    INVARIANT_QUESTIONS_COLLECTION,
    invariantQuestionsIndexes,
    invariantQuestionsValidator,
    LEADERBOARD_COLLECTION,
    leaderboardIndexes,
    leaderboardValidator,
    PII_QUESTIONS_COLLECTION,
    piiQuestionsIndexes,
    piiQuestionsValidator,
    STRICT_VALIDATION
} from "./schemas";

interface CollectionSpec {
    name: string;
    validator: { $jsonSchema: unknown };
    indexes: IndexDescription[];
}

const COLLECTION_SPECS: CollectionSpec[] = [
    {
        name: GROUPS_COLLECTION,
        validator: groupsValidator,
        indexes: groupsIndexes
    },
    {
        name: PII_QUESTIONS_COLLECTION,
        validator: piiQuestionsValidator,
        indexes: piiQuestionsIndexes
    },
    {
        name: INVARIANT_QUESTIONS_COLLECTION,
        validator: invariantQuestionsValidator,
        indexes: invariantQuestionsIndexes
    },
    {
        name: GAME_SESSIONS_COLLECTION,
        validator: gameSessionsValidator,
        indexes: gameSessionsIndexes
    },
    {
        name: FEEDBACK_COLLECTION,
        validator: feedbackValidator,
        indexes: feedbackIndexes
    },
    {
        name: ADMIN_USERS_COLLECTION,
        validator: adminUsersValidator,
        indexes: adminUsersIndexes
    },
    {
        name: LEADERBOARD_COLLECTION,
        validator: leaderboardValidator,
        indexes: leaderboardIndexes
    }
];

async function ensureCollection(
    db: Db,
    name: string,
    validator: CollectionSpec["validator"]
): Promise<void> {
    const collections = await db.listCollections({ name }).toArray();
    if (collections.length === 0) {
        await db.createCollection(name, {
            validator,
            validationLevel: STRICT_VALIDATION.validationLevel,
            validationAction: STRICT_VALIDATION.validationAction
        });
        return;
    }

    const command = {
        collMod: name,
        validator,
        validationLevel: STRICT_VALIDATION.validationLevel,
        validationAction: STRICT_VALIDATION.validationAction
    };
    await db.command(command);
}

async function ensureIndexes(
    db: Db,
    name: string,
    indexes: CollectionSpec["indexes"]
): Promise<void> {
    const collection = db.collection(name);
    for (const indexSpec of indexes) {
        const options: Parameters<typeof collection.createIndex>[1] = {
            name: indexSpec.name,
            unique: indexSpec.unique === true,
            sparse: indexSpec.sparse === true
        };
        if (indexSpec.partialFilterExpression !== undefined) {
            options.partialFilterExpression =
                indexSpec.partialFilterExpression;
        }
        await collection.createIndex(indexSpec.key, options);
    }
}

export async function setupDatabase(db: Db): Promise<void> {
    for (const spec of COLLECTION_SPECS) {
        await ensureCollection(db, spec.name, spec.validator);
        await ensureIndexes(db, spec.name, spec.indexes);
    }
}
