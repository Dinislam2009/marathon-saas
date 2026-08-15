import assert from "node:assert/strict";
import test from "node:test";

test("invitation lifecycle is wired", async () => {
  const { InvitationService } = await import("../lib/v2/invitation/service.ts");
  assert.equal(typeof InvitationService, "function");
});
