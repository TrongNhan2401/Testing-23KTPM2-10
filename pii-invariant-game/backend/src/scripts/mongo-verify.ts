/**
 * MongoDB verification script.
 * Inspects the actual documents stored in Atlas.
 */
import dotenv from "dotenv";
dotenv.config();

import { connectDatabase, closeMongoClient } from "../modules/shared/database";
import {
    GAME_SESSIONS_COLLECTION,
    GROUPS_COLLECTION,
    LEADERBOARD_COLLECTION
} from "../modules/shared/database/schemas";

async function main() {
    const db = await connectDatabase();
    console.log("Connected to:", db.databaseName);
    console.log();

    // Check groups
    const groups = await db.collection(GROUPS_COLLECTION).find().toArray();
    console.log("=== GROUPS ===");
    console.log("Count:", groups.length);
    for (const g of groups.slice(0, 3)) {
        console.log(`  ${g.groupId}: status=${g.status}, selectionToken=${g.selectionToken ? "set" : "null"}`);
    }
    if (groups.length > 3) console.log(`  ... and ${groups.length - 3} more`);
    console.log();

    // Check game sessions
    const sessions = await db.collection(GAME_SESSIONS_COLLECTION).find().toArray();
    console.log("=== GAME SESSIONS ===");
    console.log("Count:", sessions.length);
    for (const s of sessions) {
        console.log(`  ${s.sessionId} (${s.groupId}): ${s.status}`);
        console.log(`    answers: ${s.answers.length}, score: ${s.score?.totalPoints ?? "null"} pts`);
        console.log(`    piiSnapshot: ${s.piiSnapshot.length}, invariantSnapshot: ${s.invariantSnapshot.length}`);
    }
    console.log();

    // Check leaderboard
    const lb = await db.collection(LEADERBOARD_COLLECTION).find().sort({ latestScore: -1, lastSubmittedAt: 1 }).toArray();
    console.log("=== LEADERBOARD ===");
    console.log("Count:", lb.length);
    for (const e of lb) {
        console.log(`  ${e.groupId}: score=${e.latestScore}, session=${e.latestSessionId}, rank=${e.rank ?? "(not stored)"}`);
    }

    await closeMongoClient();
}

main().catch(err => { console.error("[FATAL]", err); process.exit(1); });
