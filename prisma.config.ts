import "dotenv/config";
import { defineConfig } from "@prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: "prisma/schema-v2.prisma",
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});