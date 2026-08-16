import assert from "node:assert/strict";
import test from "node:test";
import {
  ORGANIZATION_WRITE_ROLES,
  OrganizationAccessError,
  getActorId,
  requireOrganizationAccess,
} from "../lib/v2/organization/access.ts";

function prismaFor(role: string | null) {
  return {
    organizationMembership: {
      async findUnique() {
        return role ? { organizationId: "org-1", userId: "user-1", role } : null;
      },
    },
  } as never;
}

test("RBAC: OWNER, ADMIN and MANAGER can write", async () => {
  for (const role of ORGANIZATION_WRITE_ROLES) {
    const membership = await requireOrganizationAccess(prismaFor(role), "org-1", "user-1", { write: true });
    assert.equal(membership.role, role);
  }
});

test("RBAC: CURATOR cannot write by default", async () => {
  await assert.rejects(
    () => requireOrganizationAccess(prismaFor("CURATOR"), "org-1", "user-1", { write: true }),
    (error: unknown) => error instanceof OrganizationAccessError && error.status === 403,
  );
});

test("RBAC: STUDENT cannot write by default", async () => {
  await assert.rejects(
    () => requireOrganizationAccess(prismaFor("STUDENT"), "org-1", "user-1", { write: true }),
    (error: unknown) => error instanceof OrganizationAccessError && error.status === 403,
  );
});

test("RBAC: membership is required even for reads", async () => {
  await assert.rejects(
    () => requireOrganizationAccess(prismaFor(null), "org-1", "user-1"),
    (error: unknown) => error instanceof OrganizationAccessError && error.status === 403,
  );
});

test("RBAC: missing authentication is 401", () => {
  assert.throws(
    () => getActorId(new Request("http://localhost/api/v2/test")),
    (error: unknown) => error instanceof OrganizationAccessError && error.status === 401,
  );
});

test("RBAC: explicit write role policy is respected", async () => {
  await requireOrganizationAccess(prismaFor("CURATOR"), "org-1", "user-1", {
    write: true,
    writeRoles: ["CURATOR"],
  });

  await assert.rejects(
    () => requireOrganizationAccess(prismaFor("MANAGER"), "org-1", "user-1", {
      write: true,
      writeRoles: ["CURATOR"],
    }),
    (error: unknown) => error instanceof OrganizationAccessError && error.status === 403,
  );
});
