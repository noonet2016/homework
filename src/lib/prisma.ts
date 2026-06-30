import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";

const dbUrl = process.env.DATABASE_URL;
let prismaInstance: PrismaClient;

if (dbUrl) {
  const adapter = new PrismaMariaDb(dbUrl);
  prismaInstance = new PrismaClient({ adapter });
} else {
  // Fallback for build time when DATABASE_URL is not set
  prismaInstance = new PrismaClient({} as any);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? prismaInstance;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
