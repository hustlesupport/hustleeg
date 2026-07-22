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
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
