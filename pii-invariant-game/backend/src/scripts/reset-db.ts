/**
 * Reset script: clears all game sessions and resets all groups to WAITING.
 * Use this between test runs to get a clean slate.
 */
import dotenv from "dotenv";
dotenv.config();

import { connectDatabase, closeMongoClient } from "../modules/shared/database";
import { GROUPS_COLLECTION, GAME_SESSIONS_COLLECTION } from "../modules/shared/database/schemas";

async function main() {
    const db = await connectDatabase();
    console.log("Connected to:", db.databaseName);

    // Reset all groups to WAITING, clear session tokens
    const groupsResult = await db.collection(GROUPS_COLLECTION).updateMany(
        {},
        {
            $set: {
                status: "WAITING",
                activeSessionId: null,
                selectionToken: null,
                selectionExpiresAt: null
            }
        }
    );
    console.log(`Groups reset: ${groupsResult.modifiedCount} updated`);

    // Delete all game sessions
    const sessionsResult = await db.collection(GAME_SESSIONS_COLLECTION).deleteMany({});
    console.log(`Game sessions deleted: ${sessionsResult.deletedCount} removed`);

    // Drop leaderboard
    try {
        const lbResult = await db.collection("leaderboard").deleteMany({});
        console.log(`Leaderboard cleared: ${lbResult.deletedCount} removed`);
    } catch {
        console.log("Leaderboard collection not found or already empty");
    }

    await closeMongoClient();
    console.log("Done. Fresh slate ready.");
}

main().catch(err => {
    console.error("[FATAL]", err);
    process.exit(1);
});
