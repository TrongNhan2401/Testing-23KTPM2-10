import { Router } from "express";
import { getDatabase } from "../shared/database";
import { GroupsController } from "./controller";
import { GroupsRepository } from "./repository";
import { GroupsService } from "./service";

/**
 * Build the router for the lobby / group-selection feature.
 * Mounted at /api/v1/groups by app.ts.
 *
 * getDatabase() is async; we wait for it once on first request via
 * an Express middleware so that route handlers can stay synchronous.
 */
async function buildRepo(): Promise<GroupsRepository> {
    const db = await getDatabase();
    return new GroupsRepository(db);
}

export async function buildGroupsRouter(): Promise<Router> {
    const repo = await buildRepo();
    const service = new GroupsService(repo);
    const controller = new GroupsController(service);

    const router = Router();

    router.get("/", controller.listLobby);
    router.get("/:groupId", controller.getGroup);

    router.post("/select", controller.selectGroup);
    router.post("/release", controller.releaseGroup);

    router.use(GroupsController.errorHandler);

    return router;
}
