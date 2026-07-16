import dotenv from "dotenv";
import {
    closeMongoClient,
    connectDatabase
} from "../modules/shared/database";
import { runSeed } from "../modules/shared/database/seed";

dotenv.config();

async function main(): Promise<void> {
    const start = Date.now();
    const db = await connectDatabase();
    console.log(`[seed] connected to '${db.databaseName}' in ${Date.now() - start}ms`);

    const result = await runSeed(db);
    console.log("[seed] ===== result =====");
    console.log(JSON.stringify(result, null, 2));
    console.log("[seed] ===== done in " + (Date.now() - start) + "ms =====");

    await closeMongoClient();
}

main().catch((error: unknown) => {
    const message =
        error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`[seed] FAILED:\n${message}\n`);
    process.exit(1);
});