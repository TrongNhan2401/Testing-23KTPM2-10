import { Router } from "express";
import { getDatabase } from "../shared/database";
import { LeaderboardController } from "./controller";
import { LeaderboardRepository } from "./repository";
import { LeaderboardService } from "./service";

// Eagerly build the router once the database is available.
// The server guarantees the client is connected before handling any request.
let routerPromise: Promise<Router> | null = null;

export async function buildLeaderboardRouter(): Promise<Router> {
    if (routerPromise) return routerPromise;

    routerPromise = (async () => {
        const db = await getDatabase();
        const repo = new LeaderboardRepository(db);
        const service = new LeaderboardService(repo);
        const controller = new LeaderboardController(service);

        const router = Router();
        router.get("/", controller.getLeaderboard);
        router.use(LeaderboardController.errorHandler);
        return router;
    })();

    return routerPromise;
}
