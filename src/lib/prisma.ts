import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { assertProductionDatabaseConfiguration } from "@/lib/database-config";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaLibSql;
};

const databaseUrl = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

assertProductionDatabaseConfiguration();

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter =
  globalForPrisma.prismaAdapter ?? new PrismaLibSql({
    url: databaseUrl,
    ...(authToken ? { authToken } : {}),
  });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prismaAdapter = adapter;
globalForPrisma.prisma = prisma;

export default prisma;
