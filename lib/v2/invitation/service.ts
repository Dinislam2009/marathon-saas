import { randomBytes } from "node:crypto";
import type { MembershipRole } from "../organization/types.ts";
import { InvitationAccessError, InvitationStateError, type CreateInvitationInput, type InvitationRecord, type InvitationRepository } from "./types.ts";

const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class InvitationService {
  private readonly repository: InvitationRepository;

  constructor(repository: InvitationRepository) {
    this.repository = repository;
  }

  async createInvitation(input: CreateInvitationInput, actorRole: MembershipRole): Promise<InvitationRecord> {
    if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
      throw new InvitationAccessError("Only organization owners and admins can create invitations.");
    }

    const email = normalizeEmail(input.email);
    const existing = await this.repository.findPendingByEmail(input.organizationId, email);
    if (existing && existing.expiresAt > new Date()) {
      throw new InvitationStateError("A pending invitation already exists for this email.");
    }

    return this.repository.createInvitation({
      ...input,
      email,
      token: randomBytes(32).toString("hex"),
    });
  }

  async createInvitationWithDefaultExpiry(input: Omit<CreateInvitationInput, "expiresAt">, actorRole: MembershipRole): Promise<InvitationRecord> {
    return this.createInvitation({ ...input, expiresAt: new Date(Date.now() + DEFAULT_INVITATION_TTL_MS) }, actorRole);
  }

  async acceptInvitation(token: string, user: { id: string; email: string }): Promise<InvitationRecord> {
    const invitation = await this.repository.findByToken(token);
    if (!invitation) throw new InvitationStateError("Invitation not found.");
    if (invitation.status !== "PENDING") throw new InvitationStateError(`Invitation is already ${invitation.status.toLowerCase()}.`);

    if (invitation.expiresAt <= new Date()) {
      await this.repository.updateStatus(invitation.id, "EXPIRED");
      throw new InvitationStateError("Invitation has expired.");
    }

    if (normalizeEmail(user.email) !== invitation.email) {
      throw new InvitationAccessError("This invitation belongs to a different email address.");
    }

    return this.repository.acceptInvitation({
      invitationId: invitation.id,
      userId: user.id,
      organizationId: invitation.organizationId,
      role: invitation.role,
    });
  }

  async revokeInvitation(invitationId: string, actorRole: MembershipRole): Promise<InvitationRecord> {
    if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
      throw new InvitationAccessError("Only organization owners and admins can revoke invitations.");
    }

    const invitation = await this.repository.findById(invitationId);
    if (!invitation) throw new InvitationStateError("Invitation not found.");
    if (invitation.status !== "PENDING") throw new InvitationStateError("Only pending invitations can be revoked.");

    return this.repository.updateStatus(invitation.id, "REVOKED", { revokedAt: new Date() });
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
