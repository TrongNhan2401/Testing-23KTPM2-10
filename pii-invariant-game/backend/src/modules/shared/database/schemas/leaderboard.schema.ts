import { Document, IndexDescription } from "mongodb";

export const LEADERBOARD_COLLECTION = "leaderboard" as const;

export interface LeaderboardDoc extends Document {
    _id: Document["_id"];
    groupId: string;
    latestSessionId: string;
    latestScore: number;
    /**
     * Transient field. Written as a side-effect of upsertScore but NOT
     * required by the validator; the authoritative rank is computed in
     * LeaderboardService.getLeaderboard() from the sorted query result.
     * Storing it here is optional and may be stale.
     */
    rank?: number;
    lastSubmittedAt: Date;
}

export const leaderboardValidator = {
    $jsonSchema: {
        bsonType: "object",
        required: [
            "groupId",
            "latestSessionId",
            "latestScore",
            "lastSubmittedAt"
        ],
        properties: {
            _id: { bsonType: "objectId" },
            groupId: {
                bsonType: "string",
                pattern: "^Group(0[1-9]|10)$"
            },
            latestSessionId: {
                bsonType: "string",
                pattern: "^gs_[a-z0-9]{12,}$"
            },
            latestScore: { bsonType: "int", minimum: 0 },
            /**
             * Transient rank field. The authoritative rank is computed in
             * the service layer from the sorted query result.  This field
             * may be absent or stale and is not written by upsertScore.
             */
            rank: { bsonType: "int", minimum: 1 },
            lastSubmittedAt: { bsonType: "date" }
        },
        additionalProperties: false
    }
};

export const leaderboardIndexes: IndexDescription[] = [
    { key: { groupId: 1 }, name: "groupId_unique", unique: true },
    {
        key: { latestScore: -1, lastSubmittedAt: 1 },
        name: "latestScore_desc_lastSubmittedAt_idx"
    }
];