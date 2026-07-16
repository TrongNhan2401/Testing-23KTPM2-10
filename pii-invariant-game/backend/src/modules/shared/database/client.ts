import dns from "node:dns";
import { ClientSession, MongoClient, MongoClientOptions } from "mongodb";
import { env } from "../../../config/env";

// TEMPORARY WORKAROUND for Node.js DNS resolver issues on some Windows
// environments:
//
// On certain Windows machines, Node's bundled c-ares resolver (used by
// `dns.resolveSrv` and friends) returns `ECONNREFUSED` against the system
// DNS server, even though the OS resolver (nslookup / getaddrinfo) works
// correctly and TCP connectivity to Atlas is fine. This forces the SRV
// lookup of `_mongodb._tcp.<cluster>.mongodb.net` to fail with
// `querySrv ECONNREFUSED`.
//
// Routing Node's DNS through Google's public resolvers bypasses the broken
// local c-ares path and lets SRV-based connection strings resolve.
//
// Why this is safe:
//   - It is a DNS infrastructure concern, not a business-logic concern.
//   - The MongoDB driver's auth/TLS/connection pipeline is unchanged.
//   - It only affects DNS resolution performed by this Node process.
//
// If the environment is later moved to a host where the bundled resolver
// works (e.g. macOS, Linux, or a repaired Windows DNS stack), this call
// becomes a harmless no-op (Google's DNS servers still resolve public SRV
// records correctly). Remove only after confirming the underlying bug is
// fixed in the deployment environment.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const CLIENT_OPTIONS: MongoClientOptions = {
    appName: "pii-sentinel-backend",
    maxPoolSize: 10,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5_000,
    connectTimeoutMS: 5_000,
};

let client: MongoClient | null = null;
let connecting: Promise<MongoClient> | null = null;
let connected = false;

export async function getMongoClient(): Promise<MongoClient> {
    if (connected && client) {
        return client;
    }

    if (connecting) {
        return connecting;
    }

    connecting = (async () => {
        const newClient = new MongoClient(env.MONGODB_URI, CLIENT_OPTIONS);
        try {
            await newClient.connect();
            client = newClient;
            connected = true;
            return newClient;
        } catch (error) {
            connecting = null;
            throw error;
        }
    })();

    return connecting;
}

export function isMongoConnected(): boolean {
    return connected;
}

/**
 * Start a new ClientSession for transactions.
 *
 * IMPORTANT: MongoDB transactions require a replica set or sharded cluster.
 * Transactions will fail on a standalone MongoDB deployment with:
 *   MongoServerError: Transaction numbers are only allowed on a replica set member or mongos
 *
 * Call `checkReplicaSetSupport()` after the client is connected if you need
 * to verify transaction support before using sessions.
 */
export function startSession(): ClientSession {
    if (!client) {
        throw new Error("MongoDB client is not connected. Call getMongoClient() first.");
    }
    return client.startSession();
}

export async function closeMongoClient(): Promise<void> {
    if (!client) {
        return;
    }

    const closingClient = client;
    client = null;
    connected = false;
    connecting = null;
    await closingClient.close();
}