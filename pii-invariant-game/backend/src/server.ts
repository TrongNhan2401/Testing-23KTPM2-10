import dotenv from "dotenv";
import app from "./app";
import {
    connectDatabase,
    getMongoClient,
    registerGracefulShutdown,
    setupDatabase
} from "./modules/shared/database";
import { env } from "./config/env";

dotenv.config();

async function checkReplicaSetSupport(): Promise<void> {
    const client = await getMongoClient();

    let helloResult: Record<string, unknown> | null = null;
    try {
        helloResult = await client.db(env.MONGODB_DB_NAME).command(
            { hello: 1 },
            { readPreference: "primaryPreferred" }
        );
    } catch (_err: unknown) {
        // hello failed — likely a connectivity issue that setupDatabase
        // would have already caught.  Continue and let the app start;
        // the game service will fail fast if transactions are used.
        // eslint-disable-next-line no-console
        console.warn(
            "[bootstrap] could not run hello command — skipping " +
                "replica-set transaction check. " +
                "The game service will fail if transactions are required."
        );
        return;
    }

    const setName = helloResult && helloResult["setName"];
    if (setName && typeof setName === "string") {
        // eslint-disable-next-line no-console
        console.log(
            `[bootstrap] replica-set detected (setName="${setName}") — ` +
                "MongoDB transactions are supported."
        );
    } else {
        // eslint-disable-next-line no-console
        console.warn(
            "[bootstrap] WARNING: this MongoDB deployment does not appear to be " +
                "a replica set. Transactions will not work. " +
                "The game service will fail fast when attempting to submit a game. " +
                "Deploy against MongoDB Atlas (M0/M2/M5+) for replica-set support."
        );
    }
}

async function bootstrap(): Promise<void> {
    const db = await connectDatabase();
    await setupDatabase(db);

    // Verify transactions are available before accepting requests.
    // This is a one-time check at startup.
    await checkReplicaSetSupport();

    registerGracefulShutdown();

    app.listen(env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server running on http://localhost:${env.PORT}`);
    });
}

bootstrap().catch((error: unknown) => {
    const message =
        error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`[bootstrap] Fatal startup error:\n${message}\n`);
    process.exit(1);
});
