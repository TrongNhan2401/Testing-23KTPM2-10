import { Db } from "mongodb";
import { env } from "../../../config/env";
import {
    closeMongoClient,
    getMongoClient,
    isMongoConnected,
} from "./client";

export async function getDatabase(): Promise<Db> {
    const client = await getMongoClient();
    return client.db(env.MONGODB_DB_NAME);
}

export function isDatabaseConnected(): boolean {
    return isMongoConnected();
}

export async function connectDatabase(): Promise<Db> {
    return getDatabase();
}

let shutdownListenersRegistered = false;

export function registerGracefulShutdown(): void {
    if (shutdownListenersRegistered) {
        return;
    }

    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
        try {
            await closeMongoClient();
            process.exit(0);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            process.stderr.write(
                `[mongo] Error while closing client on ${signal}: ${message}\n`,
            );
            process.exit(1);
        }
    };

    process.on("SIGINT", () => {
        void shutdown("SIGINT");
    });
    process.on("SIGTERM", () => {
        void shutdown("SIGTERM");
    });

    shutdownListenersRegistered = true;
}