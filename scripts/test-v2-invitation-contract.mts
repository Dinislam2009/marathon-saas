import assert from "node:assert/strict";
import test from "node:test";

test("invitation service exposes the core lifecycle", async () => {
  const { InvitationService } = await import("../lib/v2/invitation/service.ts");
  assert.equal(typeof InvitationService.prototype.createInvitation, "function");
  assert.equal(typeof InvitationService.prototype.acceptInvitation, "function");
  assert.equal(typeof InvitationService.prototype.revokeInvitation, "function");
});
