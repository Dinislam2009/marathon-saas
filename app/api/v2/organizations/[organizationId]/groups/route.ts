import { NextResponse } from "next/server.js";
import { PrismaGroupRepository } from "../../../../../../lib/v2/group/repository-prisma.ts";
import { GroupService } from "../../../../../../lib/v2/group/service.ts";
import { GROUP_STATUSES, type CreateGroupInput } from "../../../../../../lib/v2/group/types.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";
import { getActorId, organizationErrorResponse, requireOrganizationAccess } from "../../../../../../lib/v2/organization/access.ts";

function parseCapacity(value: unknown) {
  if (value === undefined || value === null) return value === null ? null : undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error("capacity must be a positive integer or null.");
  }
  return value;
}

function parseCreate(body: unknown, organizationId: string): CreateGroupInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }
  const value = body as Record<string, unknown>;
  if (typeof value.courseId !== "string" || !value.courseId.trim()) throw new Error("courseId is required.");
  if (typeof value.name !== "string") throw new Error("name is required.");
  if (value.teacherId !== undefined && value.teacherId !== null && typeof value.teacherId !== "string") {
    throw new Error("teacherId must be a string or null.");
  }
  if (value.status !== undefined && (typeof value.status !== "string" || !GROUP_STATUSES.includes(value.status as (typeof GROUP_STATUSES)[number]))) {
    throw new Error("Invalid group status.");
  }
  return {
    organizationId,
    courseId: value.courseId.trim(),
    teacherId: value.teacherId as string | null | undefined,
    name: value.name,
    capacity: parseCapacity(value.capacity),
    status: value.status as CreateGroupInput["status"],
  };
}

function service() {
  return new GroupService(new PrismaGroupRepository(prismaV2));
}

function errorResponse(error: unknown) {
  const { message, status } = organizationErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId);
    const courseId = new URL(request.url).searchParams.get("courseId") ?? undefined;
    return NextResponse.json({ groups: await service().listGroups(organizationId, courseId) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId, { write: true });
    const input = parseCreate(await request.json(), organizationId);
    const course = await prismaV2.course.findFirst({ where: { id: input.courseId, organizationId } });
    if (!course) return NextResponse.json({ error: "Course not found." }, { status: 404 });
    if (input.teacherId) {
      const teacherMembership = await prismaV2.organizationMembership.findUnique({
        where: { organizationId_userId: { organizationId, userId: input.teacherId } },
      });
      if (!teacherMembership) return NextResponse.json({ error: "Teacher is not a member of this organization." }, { status: 400 });
    }
    return NextResponse.json({ group: await service().createGroup(input) }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
