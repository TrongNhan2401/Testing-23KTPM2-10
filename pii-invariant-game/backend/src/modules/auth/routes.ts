import { Router } from "express";
import { getDatabase } from "../shared/database";
import { AuthController } from "./controller";
import { AuthService } from "./service";
import { AuthRepository } from "./repository";

let routerPromise: Promise<Router> | null = null;

export function buildAuthRouter(): Promise<Router> {
    if (routerPromise) return routerPromise;

    routerPromise = (async () => {
        const db = await getDatabase();
        const repo = new AuthRepository(db);
        const service = new AuthService(repo);
        const controller = new AuthController(service);

        const router = Router();
        router.post("/login", controller.login);
        router.use(AuthController.errorHandler);

        return router;
    })();

    return routerPromise;
}

export { AuthService } from "./service";
export { AuthRepository } from "./repository";
export {
    requireAuth,
    requireAdmin,
    type AuthenticatedRequest
} from "./middleware";
