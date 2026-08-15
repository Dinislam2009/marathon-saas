import type { MembershipRole } from "../organization/types.ts";

export const INVITATION_STATUSES = ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface InvitationRecord {
  id: string;
  organizationId: string;
  invitedByUserId: string;
  acceptedByUserId?: string | null;
  email: string;
  role: MembershipRole;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date | null;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvitationInput {
  organizationId: string;
  invitedByUserId: string;
  email: string;
  role: MembershipRole;
  expiresAt: Date;
}

export interface InvitationRepository {
  findByToken(token: string): Promise<InvitationRecord | null>;
  findPendingByEmail(organizationId: string, email: string): Promise<InvitationRecord | null>;
  createInvitation(input: CreateInvitationInput & { token: string }): Promise<InvitationRecord>;
  updateStatus(
    invitationId: string,
    status: InvitationStatus,
    data?: { acceptedByUserId?: string; acceptedAt?: Date; revokedAt?: Date },
  ): Promise<InvitationRecord>;
  acceptInvitation(input: {
    invitationId: string;
    userId: string;
    organizationId: string;
    role: MembershipRole;
  }): Promise<InvitationRecord>;
}

export class InvitationAccessError extends Error {
  constructor(message = "Invitation access denied") {
    super(message);
    this.name = "InvitationAccessError";
  }
}

export class InvitationStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvitationStateError";
  }
}
