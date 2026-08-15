import assert from "node:assert/strict";
import test from "node:test";

test("invitation statuses are stable", async () => {
  const { INVITATION_STATUSES } = await import("../lib/v2/invitation/types.ts");
  assert.equal(INVITATION_STATUSES.join(","), "PENDING,ACCEPTED,REVOKED,EXPIRED");
});
