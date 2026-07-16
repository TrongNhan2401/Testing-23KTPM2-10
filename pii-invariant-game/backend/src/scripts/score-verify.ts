/**
 * Score calculation verification script.
 * Submits a known set of answers and verifies the grading.
 */
import dotenv from "dotenv";
dotenv.config();

const BASE = "http://localhost:3000/api/v1";
const GROUP = "Group08";

async function main() {
    // Select
    let r = await fetch(`${BASE}/groups/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: GROUP })
    });
    const sel = await r.json() as Record<string, unknown>;
    const token = sel["selectionToken"] as string;
    console.log("Selected:", GROUP);

    // Start
    r = await fetch(`${BASE}/game/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: GROUP, selectionToken: token })
    });
    const start = await r.json() as Record<string, unknown>;
    console.log("Started:", start["sessionId"]);

    // Get questions
    r = await fetch(`${BASE}/game/${GROUP}/questions?selectionToken=${encodeURIComponent(token)}`);
    const qs = await r.json() as Record<string, unknown>;
    const questions = qs["questions"] as Array<Record<string, unknown>>;
    console.log("Questions:", questions.length);

    // Submit all answers (each correct answer = +2, each wrong = -1, total clamped >= 0)
    const answers = questions.map(q => ({
        board: q["board"],
        targetId: q["externalId"],
        field: "NOTES"  // Invariant board: NOTES stands in for "is this a violation?"
    }));
    r = await fetch(`${BASE}/game/${GROUP}/answer?selectionToken=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
    });
    const ans = await r.json();
    console.log("Answer response:", JSON.stringify(ans));

    // Submit
    r = await fetch(`${BASE}/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    const result = await r.json() as Record<string, unknown>;
    const score = result["score"] as Record<string, number>;
    console.log("\nScore breakdown:");
    console.log("  Correct:", score["correctCount"]);
    console.log("  Wrong:", score["wrongCount"]);
    console.log("  Total points:", score["totalPoints"]);
    console.log("  Expected range: >= 0");

    // Verify non-negative
    if (score["totalPoints"] >= 0) {
        console.log("\nPASS: Score is non-negative (clamped correctly)");
    } else {
        console.log("\nFAIL: Score should be >= 0 but got", score["totalPoints"]);
    }
}

main().catch(err => { console.error("[FATAL]", err); process.exit(1); });
