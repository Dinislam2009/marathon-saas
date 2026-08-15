import assert from "node:assert/strict";
import test from "node:test";

test("invitation schema lifecycle statuses are defined", async () => {
  const { INVITATION_STATUSES } = await import("../lib/v2/invitation/types.ts");
  assert.deepEqual(INVITATION_STATUSES, ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]);
});
