import type {
  CreateOrganizationInput,
  OrganizationRecord,
  MembershipRecord,
  MembershipRole,
  OrganizationRepository,
} from "./types";

/** Deterministic repository for unit tests; it has no Prisma dependency. */
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly organizations = new Map<string, OrganizationRecord>();
  private readonly members = new Map<string, MembershipRecord>();

  async createOrganization(
    input: Omit<CreateOrganizationInput, "ownerUserId">,
  ): Promise<OrganizationRecord> {
    const now = new Date();
    const record: OrganizationRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      slug: input.slug,
      logoUrl: input.logoUrl ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      timezone: input.timezone ?? "Asia/Almaty",
      currency: input.currency ?? "KZT",
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    this.organizations.set(record.id, record);
    return record;
  }

  async createMembership(input: {
    organizationId: string;
    userId: string;
    role: MembershipRole;
  }): Promise<MembershipRecord> {
    const now = new Date();
    const record: MembershipRecord = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.members.set(record.id, record);
    return record;
  }

  async findById(organizationId: string) {
    return this.organizations.get(organizationId) ?? null;
  }

  async findBySlug(slug: string) {
    return [...this.organizations.values()].find((item) => item.slug === slug) ?? null;
  }

  async findMembership(organizationId: string, userId: string) {
    return [...this.members.values()].find(
      (item) => item.organizationId === organizationId && item.userId === userId,
    ) ?? null;
  }

  async listMemberships(organizationId: string) {
    return [...this.members.values()].filter((item) => item.organizationId === organizationId);
  }

  async updateOrganization(
    organizationId: string,
    input: Parameters<OrganizationRepository["updateOrganization"]>[1],
  ) {
    const current = this.organizations.get(organizationId);
    if (!current) throw new Error("Organization not found");
    const updated = { ...current, ...input, updatedAt: new Date() };
    this.organizations.set(organizationId, updated);
    return updated;
  }

  async updateMembershipRole(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ) {
    const current = await this.findMembership(organizationId, userId);
    if (!current) throw new Error("Membership not found");
    const updated = { ...current, role, updatedAt: new Date() };
    this.members.set(current.id, updated);
    return updated;
  }

  async deleteMembership(organizationId: string, userId: string) {
    const current = await this.findMembership(organizationId, userId);
    if (current) this.members.delete(current.id);
  }
}
