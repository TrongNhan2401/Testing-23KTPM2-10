import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AuthService } from "./service";
import { loginBodySchema } from "./validators";
import { InvalidCredentialsError } from "./errors";

export class AuthController {
    constructor(private readonly service: AuthService) {}

    login = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const body = loginBodySchema.parse(req.body ?? {});
            const result = await this.service.login(body);
            res.status(200).json({
                success: true,
                message: "Login successful",
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
            if (err instanceof InvalidCredentialsError) {
                res.status(401).json({
                    success: false,
                    message: err.message
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
        console.error("[auth] unexpected error:", err);
        res.status(500).json({
            success: false,
            message: msg
        });
    };
}
