import assert from "node:assert/strict";
import test from "node:test";
import { InvitationAccessError, InvitationStateError, type InvitationRecord, type InvitationRepository } from "../lib/v2/invitation/types.ts";
import { InvitationService } from "../lib/v2/invitation/service.ts";

class FakeInvitationRepository implements InvitationRepository {
  invitations: InvitationRecord[] = [];
  memberships: Array<{ organizationId: string; userId: string; role: string }> = [];

  async findById(id: string) { return this.invitations.find((item) => item.id === id) ?? null; }
  async findByToken(token: string) { return this.invitations.find((item) => item.token === token) ?? null; }
  async findPendingByEmail(organizationId: string, email: string) { return this.invitations.find((item) => item.organizationId === organizationId && item.email === email && item.status === "PENDING") ?? null; }
  async createInvitation(input: Parameters<InvitationRepository["createInvitation"]>[0]) {
    const now = new Date();
    const invitation: InvitationRecord = { id: `inv-${this.invitations.length + 1}`, ...input, status: "PENDING", acceptedByUserId: null, acceptedAt: null, revokedAt: null, createdAt: now, updatedAt: now };
    this.invitations.push(invitation);
    return invitation;
  }
  async updateStatus(id: string, status: InvitationRecord["status"], data: { acceptedByUserId?: string; acceptedAt?: Date; revokedAt?: Date } = {}) {
    const invitation = await this.findById(id);
    if (!invitation) throw new Error("not found");
    Object.assign(invitation, { status, ...data, updatedAt: new Date() });
    return invitation;
  }
  async acceptInvitation(input: Parameters<InvitationRepository["acceptInvitation"]>[0]) {
    this.memberships.push({ organizationId: input.organizationId, userId: input.userId, role: input.role });
    return this.updateStatus(input.invitationId, "ACCEPTED", { acceptedByUserId: input.userId, acceptedAt: new Date() });
  }
}

test("invitation service business rules", async () => {
  const repository = new FakeInvitationRepository();
  const service = new InvitationService(repository);

  await assert.rejects(() => service.createInvitation({ organizationId: "org-1", invitedByUserId: "user-1", email: "a@example.com", role: "TEACHER", expiresAt: new Date(Date.now() + 86400000) }, "MANAGER"), InvitationAccessError);
  const invitation = await service.createInvitation({ organizationId: "org-1", invitedByUserId: "user-1", email: " A@Example.COM ", role: "TEACHER", expiresAt: new Date(Date.now() + 86400000) }, "OWNER");
  assert.equal(invitation.email, "a@example.com");
  assert.equal(invitation.status, "PENDING");
  assert.equal(invitation.token.length, 64);
  await assert.rejects(() => service.createInvitation({ organizationId: "org-1", invitedByUserId: "user-1", email: "a@example.com", role: "TEACHER", expiresAt: new Date(Date.now() + 86400000) }, "ADMIN"), InvitationStateError);
  await assert.rejects(() => service.acceptInvitation(invitation.token, { id: "user-2", email: "other@example.com" }), InvitationAccessError);
  const accepted = await service.acceptInvitation(invitation.token, { id: "user-2", email: "A@EXAMPLE.COM" });
  assert.equal(accepted.status, "ACCEPTED");
  assert.equal(accepted.acceptedByUserId, "user-2");
  assert.deepEqual(repository.memberships[0], { organizationId: "org-1", userId: "user-2", role: "TEACHER" });
  await assert.rejects(() => service.acceptInvitation(invitation.token, { id: "user-2", email: "a@example.com" }), InvitationStateError);
  const revokable = await service.createInvitation({ organizationId: "org-1", invitedByUserId: "user-1", email: "b@example.com", role: "CURATOR", expiresAt: new Date(Date.now() + 86400000) }, "ADMIN");
  const revoked = await service.revokeInvitation(revokable.id, "ADMIN");
  assert.equal(revoked.status, "REVOKED");
});
