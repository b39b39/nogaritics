import { neon } from "@neondatabase/serverless";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const sql = neon(connectionString);
  const adapter = new PrismaNeonHTTP(sql);
  return new PrismaClient({ adapter });
}

// Proxy ensures createPrismaClient() runs only on first actual query,
// not at module load time (build-time imports would fail without DATABASE_URL).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
  },
});
