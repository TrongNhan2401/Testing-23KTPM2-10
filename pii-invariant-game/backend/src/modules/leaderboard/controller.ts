import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { LeaderboardService } from "./service";

export class LeaderboardController {
    constructor(private readonly service: LeaderboardService) {}

    getLeaderboard = async (
        _req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const data = await this.service.getLeaderboard();
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
        const msg =
            err instanceof Error ? err.message : "Internal server error";
        // eslint-disable-next-line no-console
        console.error("[leaderboard] unexpected error:", err);
        res.status(500).json({ error: msg });
    };
}
