import { Db } from "mongodb";
import { LeaderboardRepository } from "./repository";

/** Public entry in the leaderboard response. */
export interface LeaderboardEntry {
    rank: number;
    groupId: string;
    latestSessionId: string;
    latestScore: number;
    lastSubmittedAt: string;
}

export interface LeaderboardResult {
    entries: LeaderboardEntry[];
}

/**
 * Service layer for the leaderboard module.
 */
export class LeaderboardService {
    constructor(private readonly repo: LeaderboardRepository) {}

    /**
     * Retrieve the full leaderboard with computed ranks.
     *
     * Sort order: latestScore DESC, lastSubmittedAt ASC.
     * Rank is 1-based, assigned in sort order.
     */
    async getLeaderboard(): Promise<LeaderboardResult> {
        const docs = await this.repo.findAll();

        const entries: LeaderboardEntry[] = docs.map((doc, index) => ({
            rank: index + 1,
            groupId: doc.groupId,
            latestSessionId: doc.latestSessionId,
            latestScore: doc.latestScore,
            lastSubmittedAt: doc.lastSubmittedAt.toISOString()
        }));

        return { entries };
    }
}
