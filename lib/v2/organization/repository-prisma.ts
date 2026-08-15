import type { PrismaClient } from "../../../generated/prisma-v2";
import type {
  CreateOrganizationInput,
  MembershipRecord,
  MembershipRole,
  OrganizationRecord,
  OrganizationRepository,
} from "./types";

type PrismaV2Client = PrismaClient;

/** Production repository backed by the isolated Loopit 2.0 Prisma client. */
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaV2Client) {}

  async createOrganization(
    input: Omit<CreateOrganizationInput, "ownerUserId">,
  ): Promise<OrganizationRecord> {
    const organization = await this.prisma.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        logoUrl: input.logoUrl ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        address: input.address ?? null,
        timezone: input.timezone ?? "Asia/Almaty",
        currency: input.currency ?? "KZT",
      },
    });

    return organization;
  }

  async createMembership(input: {
    organizationId: string;
    userId: string;
    role: MembershipRole;
  }): Promise<MembershipRecord> {
    return this.prisma.organizationMembership.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role,
      },
    });
  }

  async findById(organizationId: string): Promise<OrganizationRecord | null> {
    return this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }

  async findBySlug(slug: string): Promise<OrganizationRecord | null> {
    return this.prisma.organization.findUnique({
      where: { slug },
    });
  }

  async findMembership(
    organizationId: string,
    userId: string,
  ): Promise<MembershipRecord | null> {
    return this.prisma.organizationMembership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  async listMemberships(organizationId: string): Promise<MembershipRecord[]> {
    return this.prisma.organizationMembership.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async updateOrganization(
    organizationId: string,
    input: Parameters<OrganizationRepository["updateOrganization"]>[1],
  ): Promise<OrganizationRecord> {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: input,
    });
  }

  async updateMembershipRole(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<MembershipRecord> {
    return this.prisma.organizationMembership.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: { role },
    });
  }

  async deleteMembership(organizationId: string, userId: string): Promise<void> {
    await this.prisma.organizationMembership.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }
}
