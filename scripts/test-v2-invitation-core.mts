import assert from "node:assert/strict";
import test from "node:test";

test("invitation core files are present", async () => {
  const types = await import("../lib/v2/invitation/types.ts");
  const service = await import("../lib/v2/invitation/service.ts");
  assert.equal(types.INVITATION_STATUSES.length, 4);
  assert.equal(typeof service.InvitationService, "function");
});
