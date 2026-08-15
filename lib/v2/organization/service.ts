import {
  MEMBERSHIP_ROLES,
  OrganizationAccessError,
  type CreateOrganizationInput,
  type MembershipRole,
  type OrganizationRepository,
} from "./types";

function normalizeName(value: string) {
  const name = value.trim();
  if (name.length < 2) throw new Error("Organization name must contain at least 2 characters.");
  return name;
}

function normalizeSlug(value: string) {
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Organization slug must contain only lowercase letters, numbers and hyphens.");
  }
  return slug;
}

function assertRole(role: MembershipRole) {
  if (!MEMBERSHIP_ROLES.includes(role)) throw new Error(`Unsupported membership role: ${role}`);
}

export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async createOrganization(input: CreateOrganizationInput) {
    const name = normalizeName(input.name);
    const slug = normalizeSlug(input.slug);

    const existing = await this.repository.findBySlug(slug);
    if (existing) throw new Error("Organization slug is already in use.");

    const organization = await this.repository.createOrganization({
      name,
      slug,
      logoUrl: input.logoUrl ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      timezone: input.timezone ?? "Asia/Almaty",
      currency: input.currency ?? "KZT",
    });

    await this.repository.createMembership({
      organizationId: organization.id,
      userId: input.ownerUserId,
      role: "OWNER",
    });

    return organization;
  }

  async getOrganization(organizationId: string, userId: string) {
    await this.requireMembership(organizationId, userId);
    return this.repository.findById(organizationId);
  }

  async updateOrganization(
    organizationId: string,
    userId: string,
    input: Parameters<OrganizationRepository["updateOrganization"]>[1],
  ) {
    await this.requireRole(organizationId, userId, ["OWNER", "ADMIN"]);
    if (input.slug !== undefined) input.slug = normalizeSlug(input.slug);
    if (input.name !== undefined) input.name = normalizeName(input.name);
    return this.repository.updateOrganization(organizationId, input);
  }

  async listMembers(organizationId: string, userId: string) {
    await this.requireMembership(organizationId, userId);
    return this.repository.listMemberships(organizationId);
  }

  async changeMemberRole(
    organizationId: string,
    actorUserId: string,
    targetUserId: string,
    role: MembershipRole,
  ) {
    assertRole(role);
    const actor = await this.requireMembership(organizationId, actorUserId);
    if (actor.role !== "OWNER" && actor.role !== "ADMIN") {
      throw new OrganizationAccessError("Only OWNER or ADMIN can change member roles.");
    }

    const target = await this.requireMembership(organizationId, targetUserId);
    if (target.role === "OWNER" || role === "OWNER") {
      throw new OrganizationAccessError("OWNER role transfer requires a dedicated ownership flow.");
    }

    return this.repository.updateMembershipRole(organizationId, targetUserId, role);
  }

  async removeMember(organizationId: string, actorUserId: string, targetUserId: string) {
    await this.requireRole(organizationId, actorUserId, ["OWNER", "ADMIN"]);
    const target = await this.requireMembership(organizationId, targetUserId);
    if (target.role === "OWNER") {
      throw new OrganizationAccessError("The organization owner cannot be removed.");
    }
    await this.repository.deleteMembership(organizationId, targetUserId);
  }

  private async requireMembership(organizationId: string, userId: string) {
    const membership = await this.repository.findMembership(organizationId, userId);
    if (!membership) throw new OrganizationAccessError();
    return membership;
  }

  private async requireRole(
    organizationId: string,
    userId: string,
    allowedRoles: MembershipRole[],
  ) {
    const membership = await this.requireMembership(organizationId, userId);
    if (!allowedRoles.includes(membership.role)) {
      throw new OrganizationAccessError("Insufficient organization permissions.");
    }
    return membership;
  }
}
