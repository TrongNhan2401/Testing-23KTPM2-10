export {
    getMongoClient,
    closeMongoClient,
    isMongoConnected
} from "./client";

export {
    getDatabase,
    getDatabase as connectDatabase,
    isDatabaseConnected,
    registerGracefulShutdown
} from "./connection";

export {
    COLLECTIONS,
    getCollection,
    type CollectionName,
    type CollectionKey
} from "./collections";

export { setupDatabase } from "./setup";

export * from "./schemas";