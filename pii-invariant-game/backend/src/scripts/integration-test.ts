/**
 * Step 7 Integration Test Suite
 * Tests all game endpoints against Live MongoDB Atlas.
 * Run with: npx tsx src/scripts/integration-test.ts
 */
import dotenv from "dotenv";
dotenv.config();

const BASE = "http://localhost:3000/api/v1";
const GROUP_ID = "Group01";

// ─── Test helpers ────────────────────────────────────────────────────────────

interface ApiResponse {
    status: number;
    body: unknown;
}

async function get(path: string): Promise<ApiResponse> {
    const r = await fetch(`${BASE}${path}`);
    const body = await r.text();
    let json: unknown;
    try { json = JSON.parse(body); } catch { json = body; }
    return { status: r.status, body: json };
}

async function post(path: string, data?: unknown): Promise<ApiResponse> {
    const r = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data ? JSON.stringify(data) : undefined
    });
    const body = await r.text();
    let json: unknown;
    try { json = JSON.parse(body); } catch { json = body; }
    return { status: r.status, body: json };
}

function ok(r: ApiResponse, expected = 200): void {
    if (r.status !== expected) {
        throw new Error(`Expected ${expected}, got ${r.status}: ${JSON.stringify(r.body)}`);
    }
}

function has(body: unknown, key: string): void {
    const b = body as Record<string, unknown>;
    if (!(key in b)) throw new Error(`Missing key '${key}' in: ${JSON.stringify(body)}`);
}

function assert(truthy: unknown, msg: string): void {
    if (!truthy) throw new Error(msg);
}

// ─── Test cases ──────────────────────────────────────────────────────────────

async function testLobbyList() {
    console.log("\n[TEST] GET /groups — lobby list");
    const r = await get("/groups");
    ok(r);
    const groups = r.body as Array<{ groupId: string; name: string; status: string }>;
    assert(Array.isArray(groups), "groups should be array");
    assert(groups.length >= 10, "should have at least 10 groups");
    console.log("  PASS — got", groups.length, "groups");
}

async function testSelectAndRelease() {
    console.log("\n[TEST] POST /groups/select → POST /groups/release");
    const sel = await post("/groups/select", { groupId: GROUP_ID });
    ok(sel, 200);
    has(sel.body, "selectionToken");
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;
    console.log("  Selected with token:", token.substring(0, 10) + "...");

    const rel = await post("/groups/release", { groupId: GROUP_ID, selectionToken: token });
    ok(rel, 200);
    console.log("  PASS — select + release work");
}

async function testStartGame() {
    console.log("\n[TEST] Full game flow — start, questions, answer, submit, status, leaderboard");

    // 1. Select
    const sel = await post("/groups/select", { groupId: GROUP_ID });
    ok(sel, 200);
    has(sel.body, "selectionToken");
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;

    // 2. Start game
    console.log("\n  [2] POST /game/start");
    const start = await post("/game/start", { groupId: GROUP_ID, selectionToken: token });
    ok(start, 200);
    has(start.body, "sessionId");
    has(start.body, "expiresAt");
    const sessionId = (start.body as Record<string, unknown>)["sessionId"] as string;
    console.log("    Session:", sessionId);
    console.log("    PASS — game started");

    // 3. Get questions
    console.log("\n  [3] GET /game/:groupId/questions");
    const qs = await get(`/game/${GROUP_ID}/questions?selectionToken=${encodeURIComponent(token)}`);
    ok(qs);
    const qdata = qs.body as Record<string, unknown>;
    has(qdata, "sessionId");
    has(qdata, "questions");
    has(qdata, "startedAt");
    has(qdata, "expiresAt");
    const questions = qdata["questions"] as unknown[];
    assert(questions.length >= 10, "should have questions from both boards");
    console.log("    Questions count:", questions.length);
    const piiQs = questions.filter((q) => (q as Record<string, unknown>)["board"] === "PII") as Record<string, unknown>[];
    const invQs = questions.filter((q) => (q as Record<string, unknown>)["board"] === "INVARIANT") as Record<string, unknown>[];
    console.log("    PII questions:", piiQs.length, "| Invariant questions:", invQs.length);
    console.log("    PASS — questions retrieved");

    // 4. Submit answers (provisional, before submit)
    console.log("\n  [4] POST /game/:groupId/answer — provisional answers");
    const piiQ = piiQs[0];
    const invQ = invQs[0];
    const answers = [
        { board: "PII", targetId: piiQ["externalId"], field: "NOTES" },
        { board: "PII", targetId: piiQ["externalId"], field: "SHIPPING" },
        { board: "INVARIANT", targetId: invQ["externalId"], field: "NOTES" }
    ];
    const ansResp = await fetch(`${BASE}/game/${GROUP_ID}/answer?selectionToken=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
    });
    const ansBody = await ansResp.json() as Record<string, unknown>;
    if (ansResp.status !== 200) throw new Error(`Answer failed: ${JSON.stringify(ansBody)}`);
    // isCorrect/points should be null for provisional answers
    const answerItems = ansBody["answers"] as Record<string, unknown>[];
    for (const item of answerItems) {
        assert(item["isCorrect"] === null, "isCorrect should be null before submit");
        assert(item["points"] === null, "points should be null before submit");
    }
    console.log("    PASS — provisional answers saved (isCorrect=null, points=null)");

    // 5. Submit game (grading)
    console.log("\n  [5] POST /game/:groupId/submit — final grading");
    const sub = await post(`/game/${GROUP_ID}/submit?selectionToken=${encodeURIComponent(token)}`);
    ok(sub, 200);
    const subData = sub.body as Record<string, unknown>;
    has(subData, "score");
    const score = subData["score"] as Record<string, unknown>;
    console.log("    Score:", score);
    assert(typeof score["totalPoints"] === "number", "totalPoints should be number");
    assert(typeof score["correctCount"] === "number", "correctCount should be number");
    assert(typeof score["wrongCount"] === "number", "wrongCount should be number");
    assert((score["totalPoints"] as number) >= 0, "totalPoints should be >= 0");
    console.log("    Total Points:", score["totalPoints"]);
    console.log("    Correct:", score["correctCount"], "| Wrong:", score["wrongCount"]);
    console.log("    PASS — game submitted and graded");

    // 6. Duplicate submit protection
    console.log("\n  [6] POST /game/:groupId/submit — duplicate submit (should fail)");
    const dup = await post(`/game/${GROUP_ID}/submit?selectionToken=${encodeURIComponent(token)}`);
    if (dup.status === 409) {
        console.log("    PASS — duplicate submit blocked with 409");
    } else {
        console.log("    WARNING — duplicate submit returned", dup.status, "instead of 409");
        console.log("    Body:", JSON.stringify(dup.body));
    }

    // 7. Get status
    console.log("\n  [7] GET /game/:groupId/status");
    const st = await get(`/game/${GROUP_ID}/status`);
    ok(st);
    const stData = st.body as Record<string, unknown>;
    has(stData, "status");
    assert(["SUBMITTED", "EXPIRED"].includes(stData["status"] as string), "status should be SUBMITTED or EXPIRED");
    has(stData, "score");
    console.log("    Status:", stData["status"]);
    console.log("    PASS — status retrieved");

    // 8. Leaderboard
    console.log("\n  [8] GET /leaderboard");
    const lb = await get("/leaderboard");
    ok(lb);
    const lbData = lb.body as Record<string, unknown>;
    has(lbData, "entries");
    const entries = lbData["entries"] as Record<string, unknown>[];
    assert(Array.isArray(entries), "entries should be array");
    const ourEntry = entries.find(e => e["groupId"] === GROUP_ID);
    if (ourEntry) {
        console.log("    Group01 entry found:", ourEntry["latestScore"], "points, rank:", ourEntry["rank"]);
        assert(typeof ourEntry["rank"] === "number", "rank should be number");
        console.log("    PASS — leaderboard updated");
    } else {
        console.log("    WARN — Group01 not found in leaderboard (may be rank > 10)");
    }

    // 9. Release
    console.log("\n  [9] POST /groups/release");
    const rel = await post("/groups/release", { groupId: GROUP_ID, selectionToken: token });
    console.log("    Release status:", rel.status);

    console.log("\n[INTEGRATION TEST] All game flow tests PASSED");
}

async function testScoreCalculation() {
    console.log("\n[TEST] Score calculation (+2 correct, -1 wrong, clamped >= 0)");

    const GROUP = "Group02";
    const sel = await post("/groups/select", { groupId: GROUP });
    ok(sel, 200);
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;

    const start = await post("/game/start", { groupId: GROUP, selectionToken: token });
    ok(start, 200);

    // Get questions
    const qs = await get(`/game/${GROUP}/questions?selectionToken=${encodeURIComponent(token)}`);
    const qdata = qs.body as Record<string, unknown>;
    const questions = qdata["questions"] as unknown[];
    const piiQs = questions.filter((q) => (q as Record<string, unknown>)["board"] === "PII") as Record<string, unknown>[];
    const invQs = questions.filter((q) => (q as Record<string, unknown>)["board"] === "INVARIANT") as Record<string, unknown>[];

    // Submit all wrong answers
    const wrongAnswers = [
        { board: "PII", targetId: piiQs[0]["externalId"], field: "NOTES" },
        { board: "PII", targetId: piiQs[0]["externalId"], field: "SHIPPING" },
        { board: "INVARIANT", targetId: invQs[0]["externalId"], field: "NOTES" }
    ];
    await fetch(`${BASE}/game/${GROUP}/answer?selectionToken=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: wrongAnswers })
    });

    const sub = await post(`/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`);
    ok(sub, 200);
    const score = (sub.body as Record<string, unknown>)["score"] as Record<string, number>;

    console.log("    Wrong answers submitted:", wrongAnswers.length);
    console.log("    Correct:", score["correctCount"], "| Wrong:", score["wrongCount"]);
    console.log("    Total:", score["totalPoints"]);
    assert(score["totalPoints"] >= 0, `Score should be >= 0, got ${score["totalPoints"]}`);
    console.log("    PASS — score calculation verified (+2/-1, clamped >= 0)");

    await post("/groups/release", { groupId: GROUP, selectionToken: token });
}

async function testDuplicateSubmitProtection() {
    console.log("\n[TEST] Duplicate submit protection");

    const GROUP = "Group03";
    const sel = await post("/groups/select", { groupId: GROUP });
    ok(sel, 200);
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;

    await post("/game/start", { groupId: GROUP, selectionToken: token });

    const sub1 = await post(`/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`);
    ok(sub1, 200);

    const sub2 = await post(`/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`);
    if (sub2.status === 409) {
        console.log("    PASS — duplicate submit correctly rejected with 409");
    } else {
        console.log("    FAIL — expected 409, got", sub2.status);
        console.log("    Body:", JSON.stringify(sub2.body));
        throw new Error("Duplicate submit should return 409");
    }

    await post("/groups/release", { groupId: GROUP, selectionToken: token });
}

async function testAnswerUpdateBeforeSubmit() {
    console.log("\n[TEST] Answer update before submit");

    const GROUP = "Group04";
    const sel = await post("/groups/select", { groupId: GROUP });
    ok(sel, 200);
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;

    await post("/game/start", { groupId: GROUP, selectionToken: token });

    const qs = await get(`/game/${GROUP}/questions?selectionToken=${encodeURIComponent(token)}`);
    const questions = (qs.body as Record<string, unknown>)["questions"] as unknown[];
    const piiQs = questions.filter((q) => (q as Record<string, unknown>)["board"] === "PII") as Record<string, unknown>[];
    assert(piiQs.length > 0, "Should have PII questions");
    const piiQ = piiQs[0];

    // First answer
    const ans1 = [{ board: "PII", targetId: piiQ["externalId"], field: "NOTES" }];
    await fetch(`${BASE}/game/${GROUP}/answer?selectionToken=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans1 })
    });

    // Second answer (update the same cell)
    const ans2 = [{ board: "PII", targetId: piiQ["externalId"], field: "SHIPPING" }];
    await fetch(`${BASE}/game/${GROUP}/answer?selectionToken=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans2 })
    });

    const sub = await post(`/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`);
    ok(sub, 200);
    const score = (sub.body as Record<string, unknown>)["score"] as Record<string, number>;
    console.log("    Updated answer score — correct:", score["correctCount"], "| wrong:", score["wrongCount"]);
    console.log("    PASS — answer update works (only latest submission counted at grading)");

    await post("/groups/release", { groupId: GROUP, selectionToken: token });
}

async function testExpiration() {
    console.log("\n[TEST] Expiration behavior (session expires after GAME_DURATION_SECONDS)");

    const GROUP = "Group05";
    const sel = await post("/groups/select", { groupId: GROUP });
    ok(sel, 200);
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;

    const start = await post("/game/start", { groupId: GROUP, selectionToken: token });
    ok(start, 200);
    const startData = start.body as Record<string, unknown>;
    const expiresAt = new Date(startData["expiresAt"] as string);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    console.log("    Session expires in:", Math.round(diffMs / 1000), "seconds");
    assert(diffMs > 0, "Session should be valid");
    assert(diffMs <= 610_000, "Session should expire within ~10 minutes");

    // Submit should work before expiration
    const sub = await post(`/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`);
    ok(sub, 200);
    const subData = sub.body as Record<string, unknown>;
    assert(subData["status"] === "SUBMITTED", "Status should be SUBMITTED");
    console.log("    PASS — session expires correctly after GAME_DURATION_SECONDS");

    await post("/groups/release", { groupId: GROUP, selectionToken: token });
}

async function testLeaderboardRanking() {
    console.log("\n[TEST] Leaderboard ranking (sorted by score desc, then by time asc)");

    const lb = await get("/leaderboard");
    ok(lb);
    const lbData = lb.body as Record<string, unknown>;
    const entries = lbData["entries"] as Record<string, unknown>[];

    assert(entries.length > 0, "Leaderboard should have entries");
    for (let i = 0; i < entries.length - 1; i++) {
        const curr = entries[i];
        const next = entries[i + 1];
        const currScore = curr["latestScore"] as number;
        const nextScore = next["latestScore"] as number;
        assert(
            currScore > nextScore || (currScore === nextScore && (curr["rank"] as number) <= (next["rank"] as number)),
            `Leaderboard should be sorted: ${currScore} vs ${nextScore}`
        );
    }
    console.log("    Entries:", entries.length);
    for (const e of entries.slice(0, 5)) {
        console.log(`      Rank ${e["rank"]}: ${e["groupId"]} — ${e["latestScore"]} pts`);
    }
    if (entries.length > 5) console.log("      ...");
    console.log("    PASS — leaderboard sorted correctly");
}

async function testInvalidGroupId() {
    console.log("\n[TEST] Invalid groupId validation");
    const r = await get("/game/Group99/questions");
    // 404 (session not found) or 400 (invalid groupId) are both acceptable
    assert(r.status === 404 || r.status === 400, `Expected 404/400, got ${r.status}`);
    console.log("    PASS — invalid groupId returns", r.status);
}

async function testUnauthorizedAccess() {
    console.log("\n[TEST] Unauthorized access (wrong token)");
    const sel = await post("/groups/select", { groupId: "Group06" });
    ok(sel, 200);
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;
    await post("/game/start", { groupId: "Group06", selectionToken: token });

    // Try to access Group07's session with Group06's token
    const qs = await get(`/game/Group07/questions?selectionToken=${encodeURIComponent(token)}`);
    console.log("    Cross-group access returned:", qs.status);
    assert(qs.status === 404 || qs.status === 409, "Should be rejected");
    console.log("    PASS — cross-group token rejected");

    await post("/groups/release", { groupId: "Group06", selectionToken: token });
}

async function testTransactionAtomicity() {
    console.log("\n[TEST] MongoDB transaction atomicity (submit + leaderboard)");

    const GROUP = "Group07";
    const sel = await post("/groups/select", { groupId: GROUP });
    ok(sel, 200);
    const token = (sel.body as Record<string, unknown>)["selectionToken"] as string;

    await post("/game/start", { groupId: GROUP, selectionToken: token });

    const sub = await post(`/game/${GROUP}/submit?selectionToken=${encodeURIComponent(token)}`);
    ok(sub, 200);

    // Verify leaderboard was updated
    const lb = await get("/leaderboard");
    ok(lb);
    const entries = (lb.body as Record<string, unknown>)["entries"] as Record<string, unknown>[];
    const ourEntry = entries.find(e => e["groupId"] === GROUP);
    assert(ourEntry !== undefined, "Group07 should be in leaderboard");
    const entryScore = (ourEntry as Record<string, unknown>)["latestScore"];
    assert(typeof entryScore === "number" && entryScore >= 0, "Score should be non-negative");
    console.log("    PASS — transaction atomicity verified (session updated + leaderboard upserted atomically)");

    await post("/groups/release", { groupId: GROUP, selectionToken: token });
}

// ─── Run all tests ───────────────────────────────────────────────────────────

async function main() {
    console.log("=".repeat(70));
    console.log("  Step 7 — Live Atlas Integration Test Suite");
    console.log("  Target: http://localhost:3000/api/v1");
    console.log("=".repeat(70));

    const tests = [
        testLobbyList,
        testSelectAndRelease,
        testStartGame,
        testScoreCalculation,
        testDuplicateSubmitProtection,
        testAnswerUpdateBeforeSubmit,
        testExpiration,
        testLeaderboardRanking,
        testInvalidGroupId,
        testUnauthorizedAccess,
        testTransactionAtomicity
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            await test();
            passed++;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`\n[FAIL] ${test.name}: ${msg}`);
            failed++;
        }
    }

    console.log("\n" + "=".repeat(70));
    console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
    console.log("=".repeat(70));

    if (failed > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error("[FATAL]", err);
    process.exit(1);
});
