import { NextResponse } from "next/server.js";
import { PrismaGroupRepository } from "../../../../../../../lib/v2/group/repository-prisma.ts";
import { GroupService } from "../../../../../../../lib/v2/group/service.ts";
import { GROUP_STATUSES, type UpdateGroupInput } from "../../../../../../../lib/v2/group/types.ts";
import { prismaV2 } from "../../../../../../../lib/v2/prisma.ts";

const WRITE_ROLES = ["OWNER", "ADMIN", "MANAGER"] as const;

function getActorId(request: Request) {
  const userId = request.headers.get("x-loopit-user-id");
  if (!userId) throw new Error("Authentication required.");
  return userId;
}

async function requireOrganizationAccess(organizationId: string, userId: string, write = false) {
  const membership = await prismaV2.organizationMembership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
  });
  if (!membership) throw new Error("Organization access denied.");
  if (write && !WRITE_ROLES.includes(membership.role as (typeof WRITE_ROLES)[number])) {
    throw new Error("Insufficient organization permissions.");
  }
}

function parseCapacity(value: unknown) {
  if (value === undefined || value === null) return value === null ? null : undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error("capacity must be a positive integer or null.");
  }
  return value;
}

function parseUpdate(body: unknown): UpdateGroupInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be a JSON object.");
  const value = body as Record<string, unknown>;
  const input: UpdateGroupInput = {};
  if ("name" in value) {
    if (typeof value.name !== "string") throw new Error("name must be a string.");
    input.name = value.name;
  }
  if ("teacherId" in value) {
    if (value.teacherId !== null && typeof value.teacherId !== "string") throw new Error("teacherId must be a string or null.");
    input.teacherId = value.teacherId as string | null;
  }
  if ("capacity" in value) input.capacity = parseCapacity(value.capacity);
  if ("status" in value) {
    if (typeof value.status !== "string" || !GROUP_STATUSES.includes(value.status as (typeof GROUP_STATUSES)[number])) {
      throw new Error("Invalid group status.");
    }
    input.status = value.status as UpdateGroupInput["status"];
  }
  if (Object.keys(input).length === 0) throw new Error("At least one group field is required.");
  return input;
}

function service() {
  return new GroupService(new PrismaGroupRepository(prismaV2));
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error.";
  const status = message === "Authentication required." ? 401 : /access|permissions/.test(message) ? 403 : /not found/i.test(message) ? 404 : /required|Invalid|must |Unsupported|positive/.test(message) ? 400 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string; groupId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, groupId } = await params;
    await requireOrganizationAccess(organizationId, actorId);
    return NextResponse.json({ group: await service().getGroup(organizationId, groupId) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; groupId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, groupId } = await params;
    await requireOrganizationAccess(organizationId, actorId, true);
    const input = parseUpdate(await request.json());
    if (input.teacherId) {
      const membership = await prismaV2.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId, userId: input.teacherId } },
      });
      if (!membership) throw new Error("Teacher is not a member of this organization.");
    }
    return NextResponse.json({ group: await service().updateGroup(organizationId, groupId, input) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
