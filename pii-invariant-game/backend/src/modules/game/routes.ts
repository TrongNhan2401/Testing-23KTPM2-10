import { Router } from "express";
import { getDatabase } from "../shared/database";
import { GameController } from "./controller";
import { GameRepository } from "./repository";
import { GameService } from "./service";
import { GroupsController } from "../groups/controller";
import { GroupsRepository } from "../groups/repository";
import { GroupsService } from "../groups/service";
import { LeaderboardRepository } from "../leaderboard/repository";

let routerPromise: Promise<Router> | null = null;

export function buildGameRouter(): Promise<Router> {
    if (routerPromise) return routerPromise;

    routerPromise = (async () => {
        const db = await getDatabase();
        const gameRepo = new GameRepository(db);
        const groupsRepo = new GroupsRepository(db);
        const leaderboardRepo = new LeaderboardRepository(db);
        const groupsService = new GroupsService(groupsRepo);
        const gameService = new GameService(gameRepo, groupsRepo, leaderboardRepo);
        const gameController = new GameController(gameService);
        const groupsController = new GroupsController(groupsService);

        const router = Router();
        router.post("/start", groupsController.startGame);
        router.get("/:groupId/questions", gameController.getQuestions);
        router.post("/:groupId/answer", gameController.submitAnswers);
        router.post("/:groupId/submit", gameController.submitGame);
        router.get("/:groupId/status", gameController.getStatus);

        router.use(GameController.errorHandler);

        return router;
    })();

    return routerPromise;
}
