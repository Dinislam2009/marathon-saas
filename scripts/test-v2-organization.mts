import assert from "node:assert/strict";
import { test } from "node:test";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma-v2/index.js";
import { PrismaOrganizationRepository } from "../lib/v2/organization/repository-prisma.ts";

const databaseUrl = process.env.DATABASE_URL;
assert.ok(databaseUrl, "DATABASE_URL is required");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
const repository = new PrismaOrganizationRepository(prisma);

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `v2-ci-${suffix}@example.test`;
const slug = `v2-ci-${suffix}`;

await test("OrganizationRepository CRUD integration", async () => {
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "ci-test-hash",
      firstName: "CI",
      lastName: "Tester",
    },
  });

  try {
    const organization = await repository.createOrganization({
      name: "Loopit CI Organization",
      slug,
      timezone: "Asia/Almaty",
      currency: "KZT",
    });

    assert.equal(organization.name, "Loopit CI Organization");
    assert.equal(await repository.findBySlug(slug).then((value) => value?.id), organization.id);

    const membership = await repository.createMembership({
      organizationId: organization.id,
      userId: user.id,
      role: "OWNER",
    });

    assert.equal(membership.organizationId, organization.id);
    assert.equal(membership.userId, user.id);
    assert.equal((await repository.findMembership(organization.id, user.id))?.role, "OWNER");
    assert.equal((await repository.listMemberships(organization.id)).length, 1);

    const updatedOrganization = await repository.updateOrganization(organization.id, {
      name: "Loopit CI Organization Updated",
    });
    assert.equal(updatedOrganization.name, "Loopit CI Organization Updated");

    const updatedMembership = await repository.updateMembershipRole(
      organization.id,
      user.id,
      "ADMIN",
    );
    assert.equal(updatedMembership.role, "ADMIN");

    await repository.deleteMembership(organization.id, user.id);
    assert.equal(await repository.findMembership(organization.id, user.id), null);

    await prisma.organization.delete({ where: { id: organization.id } });
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
});

await prisma.$disconnect();
