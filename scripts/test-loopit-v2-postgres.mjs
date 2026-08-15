import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma-v2/index.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for the Loopit 2.0 PostgreSQL integration test.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const suffix = randomUUID().slice(0, 8);
const email = `ci-${suffix}@example.com`;
const slug = `ci-org-${suffix}`;

try {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "ci-test-password-hash",
      firstName: "CI",
      lastName: "Test",
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: `CI Organization ${suffix}`,
      slug,
    },
  });

  const membership = await prisma.organizationMembership.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: "OWNER",
    },
  });

  const found = await prisma.organization.findUnique({
    where: { id: organization.id },
    include: { memberships: true },
  });

  assert.equal(found?.slug, slug);
  assert.equal(found?.memberships.length, 1);
  assert.equal(found.memberships[0].id, membership.id);

  const updated = await prisma.organization.update({
    where: { id: organization.id },
    data: { name: `Updated ${suffix}` },
  });

  assert.equal(updated.name, `Updated ${suffix}`);

  console.log("Loopit 2.0 PostgreSQL integration test passed.");
} finally {
  await prisma.$disconnect();
}
