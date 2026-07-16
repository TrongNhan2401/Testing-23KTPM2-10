import express, { Router, Request, Response, NextFunction } from "express";
import cors from "cors";
import { buildGroupsRouter } from "./modules/groups";
import { buildGameRouter } from "./modules/game/routes";
import { buildLeaderboardRouter } from "./modules/leaderboard";
import { buildAuthRouter } from "./modules/auth";
import { buildFeedbackRouter } from "./modules/feedback";
import { buildAdminQuestionsRouter } from "./modules/admin/questions";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
    res.send("Backend is running");
});

// ── Lazy router builders ────────────────────────────────────────────────
//
// Both buildGroupsRouter() and buildGameRouter() return Promise<Router>
// because getDatabase() is async.  We must await the promise before
// handing a plain Express Router to the middleware.
//
// Strategy: each lazy handler captures its own promise in a persistent
// closure variable and awaits it before dispatching.

let groupsRouterPromise: Promise<Router> | null = null;
let groupsSubRouterPromise: Promise<Router> | null = null;
let leaderboardRouterPromise: Promise<Router> | null = null;
let authRouterPromise: Promise<Router> | null = null;
let feedbackRouterPromise: Promise<Router> | null = null;
let adminRouterPromise: Promise<Router> | null = null;

function lazyGroupsRouter(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!groupsRouterPromise) {
        groupsRouterPromise = buildGroupsRouter();
    }
    groupsRouterPromise
        .then((router) => router(req, res, next))
        .catch(next);
}

function lazyGameRouter(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!groupsSubRouterPromise) {
        groupsSubRouterPromise = buildGameRouter();
    }
    groupsSubRouterPromise
        .then((router) => router(req, res, next))
        .catch(next);
}

function lazyLeaderboardRouter(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!leaderboardRouterPromise) {
        leaderboardRouterPromise = buildLeaderboardRouter();
    }
    leaderboardRouterPromise
        .then((router) => router(req, res, next))
        .catch(next);
}

function lazyAuthRouter(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!authRouterPromise) {
        authRouterPromise = buildAuthRouter();
    }
    authRouterPromise
        .then((router) => router(req, res, next))
        .catch(next);
}

function lazyFeedbackRouter(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!feedbackRouterPromise) {
        feedbackRouterPromise = buildFeedbackRouter();
    }
    feedbackRouterPromise
        .then((router) => router(req, res, next))
        .catch(next);
}

function lazyAdminRouter(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!adminRouterPromise) {
        adminRouterPromise = buildAdminQuestionsRouter();
    }
    adminRouterPromise
        .then((router) => router(req, res, next))
        .catch(next);
}

// ── Route registration ───────────────────────────────────────────────────

// Lobby / group-selection (REST API v1).
app.use("/api/v1/groups", lazyGroupsRouter);

// Gameplay endpoints (REST API v1).
// All gameplay endpoints (questions, answer, submit, status, start) are
// handled by the game module's router.
app.use("/api/v1/game", lazyGameRouter);

// Leaderboard.
app.use("/api/v1/leaderboard", lazyLeaderboardRouter);

// Authentication.
app.use("/api/v1/auth", lazyAuthRouter);

// Feedback.
app.use("/api/v1/feedback", lazyFeedbackRouter);

// Admin APIs.
app.use("/api/v1/admin/questions", lazyAdminRouter);

export default app;
