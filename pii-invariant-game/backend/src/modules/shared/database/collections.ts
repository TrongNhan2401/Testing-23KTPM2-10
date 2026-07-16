import { Collection, Db, Document } from "mongodb";

export interface CollectionName {
    Groups: "groups";
    PiiQuestions: "piiQuestions";
    InvariantQuestions: "invariantQuestions";
    GameSessions: "gameSessions";
    Feedback: "feedback";
    AdminUsers: "adminUsers";
    Leaderboard: "leaderboard";
    AuditLogs: "auditLogs";
}

export type CollectionKey = keyof CollectionName;

export const COLLECTIONS: CollectionName = {
    Groups: "groups",
    PiiQuestions: "piiQuestions",
    InvariantQuestions: "invariantQuestions",
    GameSessions: "gameSessions",
    Feedback: "feedback",
    AdminUsers: "adminUsers",
    Leaderboard: "leaderboard",
    AuditLogs: "auditLogs",
};

export function getCollection<T extends Document>(
    db: Db,
    key: CollectionKey,
): Collection<T> {
    return db.collection<T>(COLLECTIONS[key]);
}