import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma-v2/index.js";

const globalForPrismaV2 = globalThis as typeof globalThis & {
  prismaV2?: PrismaClient;
};

function createPrismaV2Client() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize the Loopit 2.0 Prisma client.");
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prismaV2 =
  globalForPrismaV2.prismaV2 ?? createPrismaV2Client();

if (process.env.NODE_ENV !== "production") {
  globalForPrismaV2.prismaV2 = prismaV2;
}
