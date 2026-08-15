export const MEMBERSHIP_ROLES = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "TEACHER",
  "CURATOR",
  "ACCOUNTANT",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export type OrganizationStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

export interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  timezone: string;
  currency: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipRecord {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  ownerUserId: string;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  timezone?: string;
  currency?: string;
}

export interface OrganizationRepository {
  createOrganization(
    input: Omit<CreateOrganizationInput, "ownerUserId">,
  ): Promise<OrganizationRecord>;
  createMembership(input: {
    organizationId: string;
    userId: string;
    role: MembershipRole;
  }): Promise<MembershipRecord>;
  findById(organizationId: string): Promise<OrganizationRecord | null>;
  findBySlug(slug: string): Promise<OrganizationRecord | null>;
  findMembership(organizationId: string, userId: string): Promise<MembershipRecord | null>;
  listMemberships(organizationId: string): Promise<MembershipRecord[]>;
  updateOrganization(
    organizationId: string,
    input: Partial<Pick<OrganizationRecord, "name" | "slug" | "logoUrl" | "phone" | "email" | "address" | "timezone" | "currency" | "status">>,
  ): Promise<OrganizationRecord>;
  updateMembershipRole(
    organizationId: string,
    userId: string,
    role: MembershipRole,
  ): Promise<MembershipRecord>;
  deleteMembership(organizationId: string, userId: string): Promise<void>;
}

export class OrganizationAccessError extends Error {
  constructor(message = "Organization access denied") {
    super(message);
    this.name = "OrganizationAccessError";
  }
}
