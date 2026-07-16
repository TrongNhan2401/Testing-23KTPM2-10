import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { FeedbackService } from "./service";
import { submitFeedbackSchema, listFeedbackQuerySchema } from "./validators";
import { DuplicateFeedbackError } from "./errors";

export class FeedbackController {
    constructor(private readonly service: FeedbackService) {}

    submitFeedback = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const body = submitFeedbackSchema.parse(req.body ?? {});
            const result = await this.service.submitFeedback(body);
            res.status(201).json({
                success: true,
                message: "Feedback submitted successfully",
                data: result
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            if (err instanceof DuplicateFeedbackError) {
                res.status(409).json({
                    success: false,
                    message: err.message
                });
                return;
            }
            next(err);
        }
    };

    listFeedback = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const query = listFeedbackQuerySchema.parse(req.query ?? {});
            const result = await this.service.listFeedback({
                sessionId: query.sessionId,
                groupId: query.groupId,
                page: query.page,
                limit: query.limit
            });
            res.status(200).json({
                success: true,
                data: result
            });
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: "Bad request",
                    errors: err.issues
                });
                return;
            }
            next(err);
        }
    };

    static errorHandler = (
        err: unknown,
        _req: Request,
        res: Response,
        _next: NextFunction
    ): void => {
        if (res.headersSent) return;
        const msg =
            err instanceof Error ? err.message : "Internal server error";
        // eslint-disable-next-line no-console
        console.error("[feedback] unexpected error:", err);
        res.status(500).json({
            success: false,
            message: msg
        });
    };
}
