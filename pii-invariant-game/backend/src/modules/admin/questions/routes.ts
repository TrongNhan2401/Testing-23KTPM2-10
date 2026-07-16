import { Router } from "express";
import { getDatabase } from "../../shared/database";
import { AdminQuestionsController } from "./controller";
import { AdminQuestionsService } from "./service";
import { AdminQuestionsRepository } from "./repository";
import { AuthService } from "../../auth/routes";
import { AuthRepository } from "../../auth/routes";
import { requireAuth, requireAdmin } from "../../auth/middleware";

let routerPromise: Promise<Router> | null = null;

export function buildAdminQuestionsRouter(): Promise<Router> {
    if (routerPromise) return routerPromise;

    routerPromise = (async () => {
        const db = await getDatabase();
        const repo = new AdminQuestionsRepository(db);
        const authRepo = new AuthRepository(db);
        const service = new AdminQuestionsService(repo);
        const authService = new AuthService(authRepo);
        const controller = new AdminQuestionsController(service);

        const authMiddleware = requireAuth(authService);
        const adminMiddleware = requireAdmin;

        const router = Router();

        // PII Questions
        router.get("/pii", authMiddleware, adminMiddleware, controller.listPiiQuestions);
        router.post("/pii", authMiddleware, adminMiddleware, controller.createPiiQuestion);
        router.put("/pii/:externalId", authMiddleware, adminMiddleware, controller.updatePiiQuestion);
        router.delete("/pii/:externalId", authMiddleware, adminMiddleware, controller.deletePiiQuestion);

        // Invariant Questions
        router.get("/invariant", authMiddleware, adminMiddleware, controller.listInvariantQuestions);
        router.post("/invariant", authMiddleware, adminMiddleware, controller.createInvariantQuestion);
        router.put("/invariant/:externalId", authMiddleware, adminMiddleware, controller.updateInvariantQuestion);
        router.delete("/invariant/:externalId", authMiddleware, adminMiddleware, controller.deleteInvariantQuestion);

        router.use(AdminQuestionsController.errorHandler);

        return router;
    })();

    return routerPromise;
}

export { AdminQuestionsService } from "./service";
export { AdminQuestionsRepository } from "./repository";
