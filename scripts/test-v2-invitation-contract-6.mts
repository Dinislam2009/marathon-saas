import assert from "node:assert/strict";
import test from "node:test";

test("invitation core exports", async () => {
  const types = await import("../lib/v2/invitation/types.ts");
  assert.equal(types.INVITATION_STATUSES.length, 4);
});
