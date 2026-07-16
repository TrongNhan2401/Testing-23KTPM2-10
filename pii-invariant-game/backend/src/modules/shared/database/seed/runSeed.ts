import { Collection, Db } from "mongodb";
import {
    ADMIN_USERS_COLLECTION,
    AdminUserDoc,
    GroupDoc,
    GROUPS_COLLECTION,
    INVARIANT_QUESTIONS_COLLECTION,
    InvariantQuestionDoc,
    PII_QUESTIONS_COLLECTION,
    PiiQuestionDoc
} from "../schemas";
import { seedAdminUsers } from "./adminUsers.seed";
import { seedGroups } from "./groups.seed";
import { seedInvariantQuestions } from "./invariantQuestions.seed";
import { seedPiiQuestions } from "./piiQuestions.seed";
import type { SeedUpsertResult } from "./types";

export interface RunSeedResult {
    groups: SeedUpsertResult;
    adminUsers: SeedUpsertResult;
    piiQuestions: SeedUpsertResult;
    invariantQuestions: SeedUpsertResult;
}

export async function runSeed(db: Db): Promise<RunSeedResult> {
    const groups: Collection<GroupDoc> = db.collection<GroupDoc>(
        GROUPS_COLLECTION
    );
    const adminUsers: Collection<AdminUserDoc> = db.collection<AdminUserDoc>(
        ADMIN_USERS_COLLECTION
    );
    const piiQuestions: Collection<PiiQuestionDoc> =
        db.collection<PiiQuestionDoc>(PII_QUESTIONS_COLLECTION);
    const invariantQuestions: Collection<InvariantQuestionDoc> =
        db.collection<InvariantQuestionDoc>(INVARIANT_QUESTIONS_COLLECTION);

    const groupsResult = await seedGroups(groups);
    const adminUsersResult = await seedAdminUsers(adminUsers);
    const piiQuestionsResult = await seedPiiQuestions(piiQuestions);
    const invariantQuestionsResult =
        await seedInvariantQuestions(invariantQuestions);

    return {
        groups: groupsResult,
        adminUsers: adminUsersResult,
        piiQuestions: piiQuestionsResult,
        invariantQuestions: invariantQuestionsResult
    };
}