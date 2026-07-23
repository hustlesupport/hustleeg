import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Reuse a single connection pool + client across hot reloads in dev,
// and across warm serverless invocations in production.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Only construct a new adapter (and its underlying connection pool) when we
// actually need a new PrismaClient — building one on every module
// evaluation (e.g. every Turbopack hot reload in dev) leaks a pool per
// reload and exhausts Supabase's free-tier connection limit.
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Module-level singleton caching only holds within a single process — the
    // Next.js build spawns several worker processes in parallel, and each
    // serverless invocation in production is its own process too, so a small
    // per-instance cap keeps total connections under Supabase's pooler limit
    // even when many instances run at once.
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      // Supabase's pooler (Supavisor) silently closes idle connections server-side;
      // if pg's own pool doesn't recycle a connection before that happens, the next
      // query on it fails with "Server has closed the connection". Recycling
      // client-side well before the pooler would, plus TCP keepalives, avoids
      // handing out a connection that's already dead on the other end.
      idleTimeoutMillis: 10_000,
      keepAlive: true,
    }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
