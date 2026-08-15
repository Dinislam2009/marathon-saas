import type { PrismaClient } from "../../../generated/prisma-v2/index.js";
import type { MembershipRole } from "../organization/types.ts";
import type { CreateInvitationInput, InvitationRecord, InvitationRepository, InvitationStatus } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly prisma: PrismaV2Client) {}

  async findByToken(token: string): Promise<InvitationRecord | null> {
    return this.prisma.organizationInvitation.findUnique({ where: { token } });
  }

  async findPendingByEmail(organizationId: string, email: string): Promise<InvitationRecord | null> {
    return this.prisma.organizationInvitation.findFirst({
      where: { organizationId, email, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
  }

  async createInvitation(input: CreateInvitationInput & { token: string }): Promise<InvitationRecord> {
    return this.prisma.organizationInvitation.create({
      data: {
        organizationId: input.organizationId,
        invitedByUserId: input.invitedByUserId,
        email: input.email,
        role: input.role,
        expiresAt: input.expiresAt,
        token: input.token,
      },
    });
  }

  async updateStatus(
    invitationId: string,
    status: InvitationStatus,
    data: { acceptedByUserId?: string; acceptedAt?: Date; revokedAt?: Date } = {},
  ): Promise<InvitationRecord> {
    return this.prisma.organizationInvitation.update({
      where: { id: invitationId },
      data: { status, ...data },
    });
  }

  async acceptInvitation(input: {
    invitationId: string;
    userId: string;
    organizationId: string;
    role: MembershipRole;
  }): Promise<InvitationRecord> {
    return this.prisma.$transaction(async (tx) => {
      await tx.organizationMembership.upsert({
        where: {
          organizationId_userId: {
            organizationId: input.organizationId,
            userId: input.userId,
          },
        },
        create: {
          organizationId: input.organizationId,
          userId: input.userId,
          role: input.role,
        },
        update: { role: input.role },
      });

      return tx.organizationInvitation.update({
        where: { id: input.invitationId },
        data: {
          status: "ACCEPTED",
          acceptedByUserId: input.userId,
          acceptedAt: new Date(),
        },
      });
    });
  }
}
