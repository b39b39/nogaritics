import { cache } from "react";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Use the runtime-native WebSocket when available (Cloudflare Workers).
// @neondatabase/serverless falls back to the 'ws' package in Node.js.
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}

// React.cache() memoises per-request rather than globally.
// Each HTTP request (page render or server action call) gets its own Pool,
// so WebSocket connections are never shared across different request contexts —
// which would cause Cloudflare Workers' "I/O on behalf of a different request" error.
const getPerRequestPrisma = cache((): PrismaClient => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
});

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPerRequestPrisma() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
