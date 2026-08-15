import type {
  CreateOrganizationInput,
  OrganizationRecord,
  MembershipRecord,
  MembershipRole,
} from "./types";

/**
 * Persistence boundary for the Organization domain.
 *
 * The service layer depends on this contract rather than Prisma directly.
 * This keeps the V2 domain isolated while the V2 Prisma client is introduced.
 */
export interface OrganizationRepository {
  createOrganization(
    input: CreateOrganizationInput,
  ): Promise<OrganizationRecord>;

  findOrganizationById(
    organizationId: string,
  ): Promise<OrganizationRecord | null>;

  findOrganizationBySlug(
    slug: string,
  ): Promise<OrganizationRecord | null>;

  updateOrganization(
    organizationId: string,
    input: Partial<Pick<CreateOrganizationInput, "name" | "slug">>,
  ): Promise<OrganizationRecord>;

  listMembers(organizationId: string): Promise<MembershipRecord[]>;

  findMembership(
    organizationId: string,
    userId: string,
  ): Promise<MembershipRecord | null>;

  updateMemberRole(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<MembershipRecord>;

  removeMember(organizationId: string, userId: string): Promise<void>;
}
