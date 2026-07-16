import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { AuthRepository } from "./repository";
import { InvalidCredentialsError } from "./errors";
import type { LoginRequest, LoginResponse, JwtPayload } from "./types";

const BCRYPT_ROUNDS = 10;

export class AuthService {
    constructor(private readonly repo: AuthRepository) {}

    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const user = await this.repo.findByUsername(credentials.username);

        if (!user) {
            throw new InvalidCredentialsError();
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
            throw new InvalidCredentialsError();
        }

        const expiresAt = new Date(Date.now() + env.JWT_EXPIRES_IN * 1000);
        const payload: Omit<JwtPayload, "iat" | "exp"> = {
            sub: user._id.toString(),
            username: user.username,
            role: user.role
        };

        const token = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN
        });

        return {
            token,
            expiresAt: expiresAt.toISOString(),
            user: {
                username: user.username,
                role: user.role
            }
        };
    }

    verifyToken(token: string): JwtPayload {
        return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    }
}
