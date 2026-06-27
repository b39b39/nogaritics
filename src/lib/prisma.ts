import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

if (typeof globalThis.WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const pool = new NeonPool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Workers: WebSocket connections in NeonPool are scoped to one request's I/O
// context and cannot be shared across requests — never cache globally in prod.
// Dev: cache globally to avoid connection exhaustion on hot reload.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client =
      process.env.NODE_ENV !== "production"
        ? (globalForPrisma.prisma ??= createPrismaClient())
        : createPrismaClient();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
