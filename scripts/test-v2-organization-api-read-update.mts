import assert from "node:assert/strict";
import test from "node:test";

test("organization read/update API contract", async () => {
  const route = await import("../app/api/v2/organizations/[organizationId]/route.ts");
  assert.equal(typeof route.GET, "function");
  assert.equal(typeof route.PATCH, "function");
});
