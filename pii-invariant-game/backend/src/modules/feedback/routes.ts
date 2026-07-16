import { Router } from "express";
import { getDatabase } from "../shared/database";
import { FeedbackController } from "./controller";
import { FeedbackService } from "./service";
import { FeedbackRepository } from "./repository";
import { AuthService } from "../auth/routes";
import { AuthRepository } from "../auth/routes";
import { requireAuth, requireAdmin } from "../auth/middleware";

let routerPromise: Promise<Router> | null = null;

export function buildFeedbackRouter(): Promise<Router> {
    if (routerPromise) return routerPromise;

    routerPromise = (async () => {
        const db = await getDatabase();
        const feedbackRepo = new FeedbackRepository(db);
        const authRepo = new AuthRepository(db);
        const feedbackService = new FeedbackService(feedbackRepo);
        const authService = new AuthService(authRepo);
        const feedbackController = new FeedbackController(feedbackService);

        const authMiddleware = requireAuth(authService);
        const adminMiddleware = requireAdmin;

        const router = Router();

        // Public: submit feedback
        router.post("/", feedbackController.submitFeedback);

        // Admin: list feedback
        router.get(
            "/",
            authMiddleware,
            adminMiddleware,
            feedbackController.listFeedback
        );

        router.use(FeedbackController.errorHandler);

        return router;
    })();

    return routerPromise;
}

export { FeedbackService } from "./service";
export { FeedbackRepository } from "./repository";
