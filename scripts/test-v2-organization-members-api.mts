import assert from "node:assert/strict";
import test from "node:test";

test("organization members API contract", async () => {
  const list = await import("../app/api/v2/organizations/[organizationId]/members/route.ts");
  const member = await import("../app/api/v2/organizations/[organizationId]/members/[userId]/route.ts");

  assert.equal(typeof list.GET, "function");
  assert.equal(typeof member.PATCH, "function");
  assert.equal(typeof member.DELETE, "function");

  const unauthenticated = await list.GET(new Request("http://localhost/api/v2/organizations/org-1/members"), {
    params: Promise.resolve({ organizationId: "org-1" }),
  });
  assert.equal(unauthenticated.status, 401);

  const invalidRole = await member.PATCH(
    new Request("http://localhost/api/v2/organizations/org-1/members/user-1", {
      method: "PATCH",
      headers: { "x-loopit-user-id": "admin-1", "content-type": "application/json" },
      body: JSON.stringify({ role: "INVALID" }),
    }),
    { params: Promise.resolve({ organizationId: "org-1", userId: "user-1" }) },
  );
  assert.equal(invalidRole.status, 400);
});
