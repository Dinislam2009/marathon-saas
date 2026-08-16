import type { PrismaClient } from "../../../generated/prisma-v2/index.js";

export const ORGANIZATION_WRITE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;
export type OrganizationWriteRole = (typeof ORGANIZATION_WRITE_ROLES)[number];

export class OrganizationAccessError extends Error {
  readonly status: 401 | 403;

  constructor(message = "Organization access denied.", status: 401 | 403 = 403) {
    super(message);
    this.name = "OrganizationAccessError";
    this.status = status;
  }
}

export function getActorId(request: Request) {
  const userId = request.headers.get("x-loopit-user-id")?.trim();
  if (!userId) throw new OrganizationAccessError("Authentication required.", 401);
  return userId;
}

export async function requireOrganizationAccess(
  prisma: PrismaClient,
  organizationId: string,
  userId: string,
  options?: { write?: boolean },
) {
  const membership = await prisma.organizationMembership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });

  if (!membership) throw new OrganizationAccessError();

  if (
    options?.write &&
    !ORGANIZATION_WRITE_ROLES.includes(membership.role as OrganizationWriteRole)
  ) {
    throw new OrganizationAccessError("Insufficient organization permissions.", 403);
  }

  return membership;
}

export function organizationErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error.";
  if (error instanceof OrganizationAccessError) {
    return { message, status: error.status };
  }
  return { message, status: /required|Invalid|must |Unsupported|positive|at least/.test(message) ? 400 : /not found/i.test(message) ? 404 : 500 };
}
