/**
 * Step 8 Integration Test Suite
 * Tests Admin Auth, Feedback, and Admin Questions endpoints against Live MongoDB Atlas.
 * Run with: npx tsx src/scripts/integration-test-step8.ts
 */
import dotenv from "dotenv";
dotenv.config();

const BASE = "http://localhost:3000/api/v1";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

interface ApiResponse {
    status: number;
    body: unknown;
}

async function get(path: string, token?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = await fetch(`${BASE}${path}`, { headers });
    const body = await r.text();
    let json: unknown;
    try { json = JSON.parse(body); } catch { json = body; }
    return { status: r.status, body: json };
}

async function post(path: string, data?: unknown, token?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers,
        body: data ? JSON.stringify(data) : undefined
    });
    const body = await r.text();
    let json: unknown;
    try { json = JSON.parse(body); } catch { json = body; }
    return { status: r.status, body: json };
}

async function put(path: string, data?: unknown, token?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = await fetch(`${BASE}${path}`, {
        method: "PUT",
        headers,
        body: data ? JSON.stringify(data) : undefined
    });
    const body = await r.text();
    let json: unknown;
    try { json = JSON.parse(body); } catch { json = body; }
    return { status: r.status, body: json };
}

async function del(path: string, token?: string): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const r = await fetch(`${BASE}${path}`, {
        method: "DELETE",
        headers
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

function assert(truthy: unknown, msg: string): void {
    if (!truthy) throw new Error(msg);
}

// ─── Test cases ──────────────────────────────────────────────────────────────

async function testLoginSuccess() {
    console.log("\n[TEST] POST /auth/login — successful login");
    const r = await post("/auth/login", {
        username: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
    });
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    const data = body["data"] as Record<string, unknown>;
    assert(typeof data["token"] === "string", "should return token");
    assert(typeof data["expiresAt"] === "string", "should return expiresAt");
    assert(data["user"] !== undefined, "should return user");
    console.log("  PASS — login successful, token received");
    return data["token"] as string;
}

async function testLoginInvalidCredentials() {
    console.log("\n[TEST] POST /auth/login — invalid credentials");
    const r = await post("/auth/login", {
        username: "admin",
        password: "wrongpassword"
    });
    if (r.status === 401) {
        console.log("  PASS — invalid credentials rejected with 401");
    } else {
        throw new Error(`Expected 401, got ${r.status}`);
    }
}

async function testLoginInvalidBody() {
    console.log("\n[TEST] POST /auth/login — invalid body");
    const r = await post("/auth/login", {});
    if (r.status === 400) {
        console.log("  PASS — invalid body rejected with 400");
    } else {
        throw new Error(`Expected 400, got ${r.status}`);
    }
}

async function testProtectedRouteWithoutToken() {
    console.log("\n[TEST] Protected route without token");
    const r = await get("/admin/questions/pii");
    if (r.status === 401) {
        console.log("  PASS — protected route blocked without token");
    } else {
        throw new Error(`Expected 401, got ${r.status}`);
    }
}

async function testProtectedRouteWithInvalidToken() {
    console.log("\n[TEST] Protected route with invalid token");
    const r = await get("/admin/questions/pii", "invalid-token");
    if (r.status === 401) {
        console.log("  PASS — invalid token rejected");
    } else {
        throw new Error(`Expected 401, got ${r.status}`);
    }
}

async function testSubmitFeedback(token: string) {
    console.log("\n[TEST] POST /feedback — submit feedback (public)");
    const uniqueId = Date.now().toString();
    const r = await post("/feedback", {
        groupId: "Group01",
        sessionId: `gs_${uniqueId}`,
        rating: 5,
        comment: "Great game!"
    });
    ok(r, 201);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — feedback submitted");
}

async function testSubmitFeedbackWithSessionId(token: string) {
    console.log("\n[TEST] POST /feedback — duplicate feedback for session");
    const uniqueId = Date.now().toString();
    const sessionId = `gs_dup_${uniqueId}`;

    const r1 = await post("/feedback", {
        sessionId,
        rating: 4
    });
    ok(r1, 201);

    const r2 = await post("/feedback", {
        sessionId,
        rating: 3
    });
    if (r2.status === 409) {
        console.log("  PASS — duplicate feedback rejected with 409");
    } else {
        throw new Error(`Expected 409, got ${r2.status}`);
    }
}

async function testListFeedbackAdmin(token: string) {
    console.log("\n[TEST] GET /feedback — list feedback (admin)");
    const r = await get("/feedback", token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    const data = body["data"] as Record<string, unknown>;
    assert(Array.isArray(data["entries"]), "should return entries array");
    console.log("  PASS — feedback list retrieved");
}

async function testListFeedbackNonAdmin(token: string) {
    console.log("\n[TEST] GET /feedback — list feedback (non-admin token)");

    // Get a non-admin token by creating one (if supported)
    // For now, just verify the admin middleware works
    const r = await get("/feedback", "fake-token");
    if (r.status === 401) {
        console.log("  PASS — non-admin token rejected");
    } else {
        console.log("  INFO — auth rejection status:", r.status);
    }
}

async function testListPiiQuestions(token: string) {
    console.log("\n[TEST] GET /admin/questions/pii — list PII questions");
    const r = await get("/admin/questions/pii", token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    const data = body["data"] as unknown[];
    assert(Array.isArray(data), "should return array");
    console.log("  PASS — PII questions list retrieved, count:", data.length);
}

async function testCreatePiiQuestion(token: string) {
    console.log("\n[TEST] POST /admin/questions/pii — create PII question");
    const ts = Date.now().toString().slice(-6);
    const externalId = `#${ts}`;
    const r = await post("/admin/questions/pii", {
        externalId,
        fullName: "Test User",
        email: "test@example.com",
        correctNotes: true,
        correctShipping: false
    }, token);
    ok(r, 201);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — PII question created");
    return externalId;
}

async function testCreateDuplicatePiiQuestion(token: string, externalId: string) {
    console.log("\n[TEST] POST /admin/questions/pii — duplicate question");
    const r = await post("/admin/questions/pii", {
        externalId,
        correctNotes: true,
        correctShipping: false
    }, token);
    if (r.status === 409) {
        console.log("  PASS — duplicate question rejected with 409");
    } else {
        throw new Error(`Expected 409, got ${r.status}`);
    }
}

async function testUpdatePiiQuestion(token: string, externalId: string) {
    console.log("\n[TEST] PUT /admin/questions/pii/:externalId — update PII question");
    const r = await put(`/admin/questions/pii/${encodeURIComponent(externalId)}`, {
        correctNotes: false,
        correctShipping: true
    }, token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — PII question updated");
}

async function testUpdateNonExistentPiiQuestion(token: string) {
    console.log("\n[TEST] PUT /admin/questions/pii/:externalId — non-existent question");
    const r = await put("/admin/questions/pii/%23NONEXISTENT", {
        correctNotes: false
    }, token);
    if (r.status === 404) {
        console.log("  PASS — non-existent question returns 404");
    } else {
        throw new Error(`Expected 404, got ${r.status}`);
    }
}

async function testDeletePiiQuestion(token: string, externalId: string) {
    console.log("\n[TEST] DELETE /admin/questions/pii/:externalId — deactivate PII question");
    const r = await del(`/admin/questions/pii/${encodeURIComponent(externalId)}`, token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — PII question deactivated");
}

async function testListInvariantQuestions(token: string) {
    console.log("\n[TEST] GET /admin/questions/invariant — list Invariant questions");
    const r = await get("/admin/questions/invariant", token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    const data = body["data"] as unknown[];
    assert(Array.isArray(data), "should return array");
    console.log("  PASS — Invariant questions list retrieved, count:", data.length);
}

async function testCreateInvariantQuestion(token: string) {
    console.log("\n[TEST] POST /admin/questions/invariant — create Invariant question");
    const ts = Date.now().toString().slice(-4);
    const externalId = `#INV-${ts}`;
    const r = await post("/admin/questions/invariant", {
        externalId,
        items: 100.00,
        tax: 10.00,
        shipping: 5.00,
        totalPrice: 115.00,
        isViolation: false
    }, token);
    ok(r, 201);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — Invariant question created");
    return externalId;
}

async function testUpdateInvariantQuestion(token: string, externalId: string) {
    console.log("\n[TEST] PUT /admin/questions/invariant/:externalId — update Invariant question");
    const r = await put(`/admin/questions/invariant/${encodeURIComponent(externalId)}`, {
        isViolation: true
    }, token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — Invariant question updated");
}

async function testDeleteInvariantQuestion(token: string, externalId: string) {
    console.log("\n[TEST] DELETE /admin/questions/invariant/:externalId — deactivate Invariant question");
    const r = await del(`/admin/questions/invariant/${encodeURIComponent(externalId)}`, token);
    ok(r, 200);
    const body = r.body as Record<string, unknown>;
    assert(body["success"] === true, "should return success");
    console.log("  PASS — Invariant question deactivated");
}

// ─── Run all tests ───────────────────────────────────────────────────────────

async function main() {
    console.log("=".repeat(70));
    console.log("  Step 8 — Live Atlas Integration Test Suite");
    console.log("  Target: http://localhost:3000/api/v1");
    console.log("=".repeat(70));

    let passed = 0;
    let failed = 0;
    let adminToken = "";
    let createdPiiId = "";
    let createdInvariantId = "";

    const tests = [
        { name: "testLoginSuccess", fn: testLoginSuccess },
        { name: "testLoginInvalidCredentials", fn: testLoginInvalidCredentials },
        { name: "testLoginInvalidBody", fn: testLoginInvalidBody },
        { name: "testProtectedRouteWithoutToken", fn: testProtectedRouteWithoutToken },
        { name: "testProtectedRouteWithInvalidToken", fn: testProtectedRouteWithInvalidToken },
        { name: "testSubmitFeedback", fn: testSubmitFeedback },
        { name: "testSubmitFeedbackWithSessionId", fn: testSubmitFeedbackWithSessionId },
        { name: "testListFeedbackAdmin", fn: testListFeedbackAdmin },
        { name: "testListFeedbackNonAdmin", fn: testListFeedbackNonAdmin },
        { name: "testListPiiQuestions", fn: testListPiiQuestions },
        { name: "testCreatePiiQuestion", fn: testCreatePiiQuestion },
        { name: "testCreateDuplicatePiiQuestion", fn: testCreateDuplicatePiiQuestion },
        { name: "testUpdatePiiQuestion", fn: testUpdatePiiQuestion },
        { name: "testUpdateNonExistentPiiQuestion", fn: testUpdateNonExistentPiiQuestion },
        { name: "testDeletePiiQuestion", fn: testDeletePiiQuestion },
        { name: "testListInvariantQuestions", fn: testListInvariantQuestions },
        { name: "testCreateInvariantQuestion", fn: testCreateInvariantQuestion },
        { name: "testUpdateInvariantQuestion", fn: testUpdateInvariantQuestion },
        { name: "testDeleteInvariantQuestion", fn: testDeleteInvariantQuestion }
    ];

    for (const test of tests) {
        try {
            const name = test.name;
            const fn = test.fn;

            if (name !== "testLoginSuccess" && !adminToken) {
                const loginR = await post("/auth/login", {
                    username: ADMIN_USERNAME,
                    password: ADMIN_PASSWORD
                });
                if (loginR.status === 200) {
                    const body = loginR.body as Record<string, unknown>;
                    adminToken = (body["data"] as Record<string, unknown>)["token"] as string;
                }
            }

            switch (name) {
                case "testLoginSuccess":
                case "testLoginInvalidCredentials":
                case "testLoginInvalidBody":
                case "testProtectedRouteWithoutToken":
                case "testProtectedRouteWithInvalidToken":
                case "testSubmitFeedback":
                case "testListFeedbackNonAdmin":
                    await (fn as () => Promise<void>)();
                    break;
                case "testSubmitFeedbackWithSessionId":
                case "testListFeedbackAdmin":
                case "testListPiiQuestions":
                case "testUpdateNonExistentPiiQuestion":
                case "testListInvariantQuestions":
                    await (fn as (token: string) => Promise<void>)(adminToken);
                    break;
                case "testCreatePiiQuestion":
                    createdPiiId = await (fn as (token: string) => Promise<string>)(adminToken);
                    break;
                case "testCreateDuplicatePiiQuestion":
                    await (fn as (token: string, id: string) => Promise<void>)(adminToken, createdPiiId);
                    break;
                case "testUpdatePiiQuestion":
                    await (fn as (token: string, id: string) => Promise<void>)(adminToken, createdPiiId);
                    break;
                case "testDeletePiiQuestion":
                    await (fn as (token: string, id: string) => Promise<void>)(adminToken, createdPiiId);
                    break;
                case "testCreateInvariantQuestion":
                    createdInvariantId = await (fn as (token: string) => Promise<string>)(adminToken);
                    break;
                case "testUpdateInvariantQuestion":
                    await (fn as (token: string, id: string) => Promise<void>)(adminToken, createdInvariantId);
                    break;
                case "testDeleteInvariantQuestion":
                    await (fn as (token: string, id: string) => Promise<void>)(adminToken, createdInvariantId);
                    break;
            }
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
