import type {
  CreateOrganizationInput,
  OrganizationRecord,
  MembershipRecord,
  MembershipRole,
} from "./types";
import type { OrganizationRepository } from "./repository";

/**
 * Deterministic repository for unit tests.
 * It deliberately has no Prisma dependency.
 */
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly organizations = new Map<string, OrganizationRecord>();
  private readonly members = new Map<string, MembershipRecord>();

  async createOrganization(
    input: CreateOrganizationInput,
  ): Promise<OrganizationRecord> {
    const record: OrganizationRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
    };

    this.organizations.set(record.id, record);
    return record;
  }

  async findOrganizationById(
    organizationId: string,
  ): Promise<OrganizationRecord | null> {
    return this.organizations.get(organizationId) ?? null;
  }

  async findOrganizationBySlug(slug: string): Promise<OrganizationRecord | null> {
    for (const organization of this.organizations.values()) {
      if (organization.slug === slug) return organization;
    }
    return null;
  }

  async updateOrganization(
    organizationId: string,
    input: Partial<Pick<CreateOrganizationInput, "name" | "slug">>,
  ): Promise<OrganizationRecord> {
    const current = this.organizations.get(organizationId);
    if (!current) throw new Error("Organization not found");

    const updated = { ...current, ...input };
    this.organizations.set(organizationId, updated);
    return updated;
  }

  async listMembers(organizationId: string): Promise<MembershipRecord[]> {
    return [...this.members.values()].filter(
      (member) => member.organizationId === organizationId,
    );
  }

  async findMembership(
    organizationId: string,
    userId: string,
  ): Promise<MembershipRecord | null> {
    for (const member of this.members.values()) {
      if (member.organizationId === organizationId && member.userId === userId) {
        return member;
      }
    }
    return null;
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<MembershipRecord> {
    const current = await this.findMembership(organizationId, userId);
    if (!current) throw new Error("Membership not found");

    const updated = { ...current, role };
    this.members.set(current.id, updated);
    return updated;
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    const current = await this.findMembership(organizationId, userId);
    if (current) this.members.delete(current.id);
  }
}
