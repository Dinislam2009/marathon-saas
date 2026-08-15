import assert from "node:assert/strict";
import test from "node:test";
import { OrganizationAccessError } from "../lib/v2/organization/types.ts";
import { OrganizationService } from "../lib/v2/organization/service.ts";

function repository() {
  const organizations = new Map<string, any>();
  const memberships = new Map<string, any>();

  return {
    async createOrganization(input: any) {
      const organization = { id: crypto.randomUUID(), ...input, status: "ACTIVE", createdAt: new Date(), updatedAt: new Date() };
      organizations.set(organization.id, organization);
      return organization;
    },
    async createMembership(input: any) {
      const membership = { id: crypto.randomUUID(), ...input, createdAt: new Date(), updatedAt: new Date() };
      memberships.set(`${input.organizationId}:${input.userId}`, membership);
      return membership;
    },
    async findById(id: string) { return organizations.get(id) ?? null; },
    async findBySlug(slug: string) { return [...organizations.values()].find((o) => o.slug === slug) ?? null; },
    async findMembership(organizationId: string, userId: string) { return memberships.get(`${organizationId}:${userId}`) ?? null; },
    async listMemberships(organizationId: string) { return [...memberships.values()].filter((m) => m.organizationId === organizationId); },
    async updateOrganization(id: string, input: any) {
      const current = organizations.get(id);
      const updated = { ...current, ...input, updatedAt: new Date() };
      organizations.set(id, updated);
      return updated;
    },
    async updateMembershipRole(organizationId: string, userId: string, role: string) {
      const key = `${organizationId}:${userId}`;
      const current = memberships.get(key);
      const updated = { ...current, role, updatedAt: new Date() };
      memberships.set(key, updated);
      return updated;
    },
    async deleteMembership(organizationId: string, userId: string) { memberships.delete(`${organizationId}:${userId}`); },
  };
}

test("OrganizationService enforces organization rules", async () => {
  const repo = repository();
  const service = new OrganizationService(repo);

  const organization = await service.createOrganization({
    name: "Loopit Academy",
    slug: "loopit-academy",
    ownerUserId: "owner-1",
  });

  assert.equal(organization.currency, "KZT");
  assert.equal(organization.timezone, "Asia/Almaty");

  await assert.rejects(
    service.createOrganization({ name: "Another Org", slug: "loopit-academy", ownerUserId: "owner-2" }),
    /slug is already in use/,
  );

  await repo.createMembership({ organizationId: organization.id, userId: "admin-1", role: "ADMIN" });
  await repo.createMembership({ organizationId: organization.id, userId: "teacher-1", role: "TEACHER" });

  const updated = await service.updateOrganization(organization.id, "admin-1", { name: "Loopit Education" });
  assert.equal(updated.name, "Loopit Education");

  const role = await service.changeMemberRole(organization.id, "admin-1", "teacher-1", "MANAGER");
  assert.equal(role.role, "MANAGER");

  await assert.rejects(
    service.removeMember(organization.id, "teacher-1", "admin-1"),
    OrganizationAccessError,
  );

  await assert.rejects(
    service.removeMember(organization.id, "admin-1", "owner-1"),
    /owner cannot be removed/,
  );

  await service.removeMember(organization.id, "admin-1", "teacher-1");
  assert.equal((await service.listMembers(organization.id, "owner-1")).length, 2);
});
