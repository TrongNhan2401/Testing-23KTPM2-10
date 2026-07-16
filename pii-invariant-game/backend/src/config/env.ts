import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),

    MONGODB_URI: z
        .string()
        .min(1, "MONGODB_URI is required. Define it in your .env file.")
        .refine(
            (value) =>
                value.startsWith("mongodb://") ||
                value.startsWith("mongodb+srv://"),
            "MONGODB_URI must start with mongodb:// or mongodb+srv://"
        ),

    MONGODB_DB_NAME: z
        .string()
        .min(1, "MONGODB_DB_NAME is required. Define it in your .env file.")
        .default("pii-sentinel"),

    // Game session duration in seconds. Default 600 (10 minutes).
    // Must be within [1, 14400] to satisfy the gameSessions validator.
    GAME_DURATION_SECONDS: z.coerce
        .number()
        .int()
        .min(1)
        .max(14400)
        .default(600),

    // JWT authentication
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters for security")
        .default("change-me-in-production-minimum-32-chars"),
    JWT_EXPIRES_IN: z
        .coerce.number()
        .int()
        .positive()
        .default(86400) // 24 hours in seconds
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    const issues = parsed.error.issues
        .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("\n");

    throw new Error(
        "Invalid environment configuration. Fix the following variables:\n" + issues
    );
}

export const env = {
    NODE_ENV: parsed.data.NODE_ENV,
    PORT: parsed.data.PORT,

    MONGODB_URI: parsed.data.MONGODB_URI,
    MONGODB_DB_NAME: parsed.data.MONGODB_DB_NAME,

    GAME_DURATION_SECONDS: parsed.data.GAME_DURATION_SECONDS,

    JWT_SECRET: parsed.data.JWT_SECRET,
    JWT_EXPIRES_IN: parsed.data.JWT_EXPIRES_IN
};

export type Env = typeof env;