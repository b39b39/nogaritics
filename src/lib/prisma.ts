import { neon, types } from "@neondatabase/serverless";
import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Neon HTTP driver returns timestamps as Date objects; Prisma's WASM engine
// expects raw ISO strings. Override to return strings.
types.setTypeParser(1082, (val: string) => val); // date
types.setTypeParser(1114, (val: string) => val); // timestamp
types.setTypeParser(1184, (val: string) => val); // timestamptz

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const sql = neon(connectionString);
  const http = new PrismaNeonHTTP(sql);

  // Prisma's WASM query engine calls transactionContext() for certain internal
  // operation sequences (deleteMany + createMany, etc.). PrismaNeonHTTP rejects
  // this call because Neon HTTP doesn't support BEGIN/COMMIT. Instead, provide a
  // no-op shim that routes queries through the same HTTP adapter without wrapping
  // them in an actual transaction. Operations execute sequentially over HTTP;
  // there is no atomicity guarantee, but the operations are idempotent enough
  // that this is safe for our use case.
  //
  // Prisma's Result<T> must include .map() and .flatMap() methods:
  //   ok(v) = { ok: true, value: v, map: fn => ok(fn(v)), flatMap: fn => fn(v) }
  function ok<T>(value: T) {
    const r: { ok: true; value: T; map: <U>(fn: (v: T) => U) => ReturnType<typeof ok<U>>; flatMap: <U>(fn: (v: T) => U) => U } = {
      ok: true,
      value,
      map: (fn) => ok(fn(value)),
      flatMap: (fn) => fn(value),
    };
    return r;
  }

  const noopOk = () => Promise.resolve(ok(undefined as void));
  const adapterName = (http as unknown as Record<string, unknown>).adapterName as string;
  const provider = (http as unknown as Record<string, unknown>).provider as string;
  const txQueryable = {
    adapterName,
    provider,
    queryRaw: http.queryRaw.bind(http),
    executeRaw: http.executeRaw.bind(http),
  };
  const fakeTx = ok({
    ...txQueryable,
    options: { isolationLevel: "ReadCommitted" as const },
    commit: noopOk,
    rollback: noopOk,
  });
  const fakeTxContext = ok({
    ...txQueryable,
    startTransaction: () => Promise.resolve(fakeTx),
  });

  const adapter = new Proxy(http, {
    get(target, prop) {
      if (prop === "transactionContext") {
        return () => Promise.resolve(fakeTxContext);
      }
      return (target as unknown as Record<string | symbol, unknown>)[prop];
    },
  }) as unknown as PrismaNeonHTTP;

  return new PrismaClient({ adapter });
}

// HTTP adapter is stateless (fetch-based): safe to cache globally in Workers.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return (globalForPrisma.prisma as unknown as Record<string | symbol, unknown>)[prop];
  },
});
