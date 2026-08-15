import assert from "node:assert/strict";
import test from "node:test";

test("invitation status constants", async () => {
  const { INVITATION_STATUSES } = await import("../lib/v2/invitation/types.ts");
  assert.ok(INVITATION_STATUSES.includes("PENDING"));
  assert.ok(INVITATION_STATUSES.includes("ACCEPTED"));
  assert.ok(INVITATION_STATUSES.includes("REVOKED"));
  assert.ok(INVITATION_STATUSES.includes("EXPIRED"));
});
