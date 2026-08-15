import assert from "node:assert/strict";
import test from "node:test";
import { InvitationStateError, type InvitationRecord, type InvitationRepository } from "../lib/v2/invitation/types.ts";
import { InvitationService } from "../lib/v2/invitation/service.ts";

class Repo implements InvitationRepository {
  invitation: InvitationRecord;
  constructor() { const now = new Date(Date.now() - 1000); this.invitation = { id: "i", organizationId: "o", invitedByUserId: "u", email: "a@example.com", role: "TEACHER", token: "t", status: "PENDING", expiresAt: now, acceptedByUserId: null, acceptedAt: null, revokedAt: null, createdAt: now, updatedAt: now }; }
  async findById(id: string) { return id === "i" ? this.invitation : null; }
  async findByToken(token: string) { return token === "t" ? this.invitation : null; }
  async findPendingByEmail() { return null; }
  async createInvitation(input: Parameters<InvitationRepository["createInvitation"]>[0]) { return { ...this.invitation, ...input }; }
  async updateStatus(_id: string, status: InvitationRecord["status"]) { this.invitation.status = status; return this.invitation; }
  async acceptInvitation() { return this.invitation; }
}

test("expired invitation is marked expired", async () => {
  const repo = new Repo();
  await assert.rejects(() => new InvitationService(repo).acceptInvitation("t", { id: "u", email: "a@example.com" }), InvitationStateError);
  assert.equal(repo.invitation.status, "EXPIRED");
});
