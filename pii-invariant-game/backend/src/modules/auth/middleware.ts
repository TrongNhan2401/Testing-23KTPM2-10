import { Request, Response, NextFunction } from "express";
import { AuthService } from "./service";
import { UnauthorizedError, ForbiddenError } from "./errors";

export interface AuthenticatedRequest extends Request {
    user?: {
        sub: string;
        username: string;
        role: string;
    };
}

export function requireAuth(service: AuthService) {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
                return;
            }

            const token = authHeader.substring(7);
            try {
                const payload = service.verifyToken(token);
                req.user = {
                    sub: payload.sub,
                    username: payload.username,
                    role: payload.role
                };
                next();
            } catch {
                res.status(401).json({
                    success: false,
                    message: "Invalid or expired token"
                });
            }
        } catch (err) {
            res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }
    };
}

export function requireAdmin(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void {
    if (!req.user || req.user.role !== "ADMIN") {
        res.status(403).json({
            success: false,
            message: "Admin access required"
        });
        return;
    }
    next();
}
