import assert from "node:assert/strict";
import test from "node:test";
import { InvitationStateError, type InvitationRecord, type InvitationRepository } from "../lib/v2/invitation/types.ts";
import { InvitationService } from "../lib/v2/invitation/service.ts";

class ExpiryRepo implements InvitationRepository {
  invitation: InvitationRecord;
  constructor() { const now = new Date(Date.now() - 1000); this.invitation = { id: "inv-expired", organizationId: "org-1", invitedByUserId: "owner-1", email: "a@example.com", role: "TEACHER", token: "expired-token", status: "PENDING", expiresAt: now, acceptedByUserId: null, acceptedAt: null, revokedAt: null, createdAt: now, updatedAt: now }; }
  async findById(id: string) { return id === this.invitation.id ? this.invitation : null; }
  async findByToken(token: string) { return token === this.invitation.token ? this.invitation : null; }
  async findPendingByEmail() { return this.invitation; }
  async createInvitation(input: Parameters<InvitationRepository["createInvitation"]>[0]) { return { ...this.invitation, ...input }; }
  async updateStatus(_id: string, status: InvitationRecord["status"]) { this.invitation.status = status; return this.invitation; }
  async acceptInvitation() { return this.invitation; }
}

test("expired invitations are transitioned to EXPIRED", async () => {
  const repository = new ExpiryRepo();
  const service = new InvitationService(repository);
  await assert.rejects(() => service.acceptInvitation("expired-token", { id: "user-1", email: "a@example.com" }), InvitationStateError);
  assert.equal(repository.invitation.status, "EXPIRED");
});
