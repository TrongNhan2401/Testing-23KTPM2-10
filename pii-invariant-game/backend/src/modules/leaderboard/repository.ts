import { ClientSession, Collection, Db, Filter } from "mongodb";
import {
    LeaderboardDoc,
    LEADERBOARD_COLLECTION
} from "../shared/database/schemas";

/**
 * Repository layer for the leaderboard module.
 *
 * All access to the leaderboard collection lives here.
 */
export class LeaderboardRepository {
    private readonly leaderboard: Collection<LeaderboardDoc>;

    constructor(db: Db) {
        this.leaderboard = db.collection<LeaderboardDoc>(
            LEADERBOARD_COLLECTION
        );
    }

    /**
     * Upsert the leaderboard entry for a group.
     *
     * If this is the group's first submission (no existing entry), insert it.
     * If the group already has an entry, replace it with the new score/session.
     *
     * IMPORTANT: This method is always called INSIDE a MongoDB transaction
     * (ClientSession).  The transaction guarantees:
     *   - This upsert and the gameSession transition are atomic.
     *   - Only one concurrent submission for a group can succeed.
     *
     * The unique index on groupId ensures no duplicate leaderboard entries
     * exist for the same group.
     *
     * @param session — the ClientSession from the parent transaction
     */
    async upsertScore(
        groupId: string,
        latestSessionId: string,
        latestScore: number,
        lastSubmittedAt: Date,
        session: ClientSession
    ): Promise<void> {
        await this.leaderboard.updateOne(
            { groupId } as Filter<LeaderboardDoc>,
            {
                $set: {
                    latestSessionId,
                    latestScore,
                    lastSubmittedAt
                }
            },
            {
                upsert: true,
                session
            }
        );
    }

    /**
     * Read the full leaderboard.
     *
     * Sort: latestScore DESC, lastSubmittedAt ASC (earlier submitter at the
     * same score ranks higher).
     *
     * Ranks are computed in the service layer from the sorted result array.
     */
    async findAll(): Promise<LeaderboardDoc[]> {
        return this.leaderboard
            .find({}, { sort: { latestScore: -1, lastSubmittedAt: 1 } })
            .toArray();
    }
}
