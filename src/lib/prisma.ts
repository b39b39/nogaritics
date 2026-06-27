import { neon, types } from "@neondatabase/serverless";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Neon's HTTP driver converts timestamp columns to Date objects by default.
// Prisma's WASM query engine expects raw ISO strings and fails on Date objects
// (serialized as {} in WASM context). Override to return strings.
types.setTypeParser(1082, (val: string) => val); // date
types.setTypeParser(1114, (val: string) => val); // timestamp
types.setTypeParser(1184, (val: string) => val); // timestamptz

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const sql = neon(connectionString);
  const adapter = new PrismaNeonHTTP(sql);
  const traced = new Proxy(adapter, {
    get(target, prop) {
      if (prop === "transactionContext") {
        return () => {
          console.error("[prisma] transactionContext called — stack:", new Error().stack);
          return Promise.reject(new Error("Transactions are not supported in HTTP mode"));
        };
      }
      return (target as unknown as Record<string | symbol, unknown>)[prop];
    },
  });
  return new PrismaClient({ adapter: traced });
}

// HTTP adapter is stateless (fetch-based): safe to cache globally in Workers.
// No WebSocket connections, no per-request I/O context issues.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
  },
});
