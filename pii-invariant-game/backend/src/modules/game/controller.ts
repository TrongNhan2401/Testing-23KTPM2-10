import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
    GameAlreadyEndedError,
    GameExpiredError,
    GameNotFoundError,
    InvalidAnswerError,
    SessionOwnershipError
} from "./errors";
import { GameService } from "./service";
import {
    groupIdParamSchema,
    submitAnswerBodySchema,
    submitGameBodySchema
} from "./validators";

export class GameController {
    constructor(private readonly service: GameService) {}

    getQuestions = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const groupId = groupIdParamSchema.parse(req.params.groupId);
            const selectionToken = String(req.query.selectionToken ?? "");
            const data = await this.service.getQuestions(groupId, selectionToken);
            res.status(200).json(data);
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: err.issues[0]?.message ?? "Bad request" });
                return;
            }
            next(err);
        }
    };

    submitAnswers = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const groupId = groupIdParamSchema.parse(req.params.groupId);
            const body = submitAnswerBodySchema.parse(req.body ?? {});
            const selectionToken = String(req.query.selectionToken ?? "");

            const data = await this.service.submitAnswers(
                groupId,
                selectionToken,
                body.answers
            );
            res.status(200).json(data);
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: err.issues[0]?.message ?? "Bad request" });
                return;
            }
            next(err);
        }
    };

    submitGame = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const groupId = groupIdParamSchema.parse(req.params.groupId);
            const body = submitGameBodySchema.parse(req.body ?? {});
            const selectionToken = String(req.query.selectionToken ?? "");

            const clientSubmittedAt = body.clientSubmittedAt
                ? new Date(body.clientSubmittedAt)
                : null;

            const data = await this.service.submitGame(
                groupId,
                selectionToken,
                clientSubmittedAt
            );
            res.status(200).json(data);
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: err.issues[0]?.message ?? "Bad request" });
                return;
            }
            next(err);
        }
    };

    getStatus = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const groupId = groupIdParamSchema.parse(req.params.groupId);
            const data = await this.service.getGameStatus(groupId);
            res.status(200).json(data);
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: err.issues[0]?.message ?? "Bad request" });
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

        if (err instanceof GameNotFoundError) {
            res.status(404).json({ error: err.message });
            return;
        }

        if (err instanceof SessionOwnershipError) {
            res.status(409).json({ error: err.message });
            return;
        }

        if (
            err instanceof GameAlreadyEndedError ||
            err instanceof GameExpiredError
        ) {
            res.status(409).json({ error: err.message });
            return;
        }

        if (err instanceof InvalidAnswerError) {
            res.status(400).json({ error: err.message });
            return;
        }

        if (err instanceof ZodError) {
            res.status(400).json({
                error: err.issues[0]?.message ?? "Bad request"
            });
            return;
        }

        const msg =
            err instanceof Error ? err.message : "Internal server error";
        // eslint-disable-next-line no-console
        console.error("[game] unexpected error:", err);
        res.status(500).json({ error: msg });
    };
}
