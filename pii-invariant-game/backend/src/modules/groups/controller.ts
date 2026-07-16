import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import {
    GameAlreadyStartedError,
    GroupAlreadySelectedError,
    GroupNotFoundError,
    QuestionDataMissingError,
    SessionOwnershipError
} from "./errors";
import { GameNotFoundError } from "../game/errors";
import { GroupsService } from "./service";
import {
    groupIdParamSchema,
    selectGroupBodySchema,
    selectionTokenBodySchema,
    startGameBodySchema
} from "./validators";

/**
 * Controller layer.
 * No business rules here. The controller:
 *  - parses/validates the incoming request (Zod)
 *  - calls the service
 *  - maps thrown domain errors to HTTP status codes
 *  - formats the response
 */
export class GroupsController {
    private readonly service: GroupsService;

    constructor(service: GroupsService) {
        this.service = service;
    }

    listLobby = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = await this.service.listLobby();
            res.status(200).json(data);
        } catch (err) {
            next(err);
        }
    };

    getGroup = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const groupId = groupIdParamSchema.parse(req.params.groupId);
            const data = await this.service.getGroup(groupId);
            res.status(200).json(data);
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: err.issues[0]?.message ?? "Bad request" });
                return;
            }
            next(err);
        }
    };

    selectGroup = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { groupId } = selectGroupBodySchema.parse(req.body ?? {});
            const data = await this.service.selectGroup(groupId);
            res.status(200).json(data);
        } catch (err) {
            if (err instanceof ZodError) {
                res.status(400).json({ error: err.issues[0]?.message ?? "Bad request" });
                return;
            }
            next(err);
        }
    };

    releaseGroup = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { groupId, selectionToken } = selectionTokenBodySchema.parse(
                req.body ?? {}
            );
            const data = await this.service.releaseGroup(
                groupId,
                selectionToken
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

    startGame = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const { groupId, selectionToken } = startGameBodySchema.merge(
                selectionTokenBodySchema
            ).parse(req.body ?? {});
            const data = await this.service.startGame(
                groupId,
                selectionToken
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

    /**
     * Centralized domain error -> HTTP mapping. Used as Express error middleware.
     */
    static errorHandler = (
        err: unknown,
        _req: Request,
        res: Response,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _next: NextFunction
    ): void => {
        if (res.headersSent) {
            // Express defaults will close the response after we return.
            return;
        }
        if (
            err instanceof GroupNotFoundError ||
            err instanceof QuestionDataMissingError ||
            err instanceof GameNotFoundError
        ) {
            res.status(404).json({ error: (err as Error).message });
            return;
        }
        if (err instanceof GroupAlreadySelectedError) {
            res.status(409).json({ error: err.message });
            return;
        }
        if (err instanceof GameAlreadyStartedError) {
            res.status(409).json({ error: err.message });
            return;
        }
        if (err instanceof SessionOwnershipError) {
            res.status(409).json({ error: err.message });
            return;
        }
        if (err instanceof ZodError) {
            res.status(400).json({
                error: err.issues[0]?.message ?? "Bad request"
            });
            return;
        }
        const e = err as { code?: number; message?: string };
        if (e && e.code === 11000) {
            res.status(409).json({ error: "Duplicate key conflict" });
            return;
        }
        const message =
            err instanceof Error ? err.message : "Internal server error";
        // eslint-disable-next-line no-console
        console.error("[groups] unexpected error:", err);
        res.status(500).json({ error: message });
    };
}