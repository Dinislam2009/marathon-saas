import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// Сыртқы adapter-ді алып тастадық. Prisma 6 енді DATABASE_URL арқылы тікелей қосылады.
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}