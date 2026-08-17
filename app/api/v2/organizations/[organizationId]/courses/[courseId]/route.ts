import { NextResponse } from "next/server.js";
import { PrismaCourseRepository } from "../../../../../../../lib/v2/course/repository-prisma.ts";
import { CourseService } from "../../../../../../../lib/v2/course/service.ts";
import { prismaV2 } from "../../../../../../../lib/v2/prisma.ts";
import { getActorId, organizationErrorResponse, requireOrganizationAccess } from "../../../../../../../lib/v2/organization/access.ts";

function errorResponse(error: unknown) {
  const { message, status } = organizationErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}

function parseUpdate(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be a JSON object.");
  const source = body as Record<string, unknown>;
  const input: Record<string, unknown> = {};
  for (const key of ["name", "description"] as const) if (key in source) input[key] = source[key];
  if (Object.keys(input).length === 0) throw new Error("At least one course field is required.");
  if (input.name !== undefined && typeof input.name !== "string") throw new Error("name must be a string.");
  if (input.description !== undefined && input.description !== null && typeof input.description !== "string") throw new Error("description must be a string or null.");
  return input;
}

function service() { return new CourseService(new PrismaCourseRepository(prismaV2)); }

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string; courseId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, courseId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId);
    return NextResponse.json({ course: await service().getCourse(organizationId, courseId) });
  } catch (error: unknown) { return errorResponse(error); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; courseId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, courseId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId, { write: true });
    const course = await service().updateCourse(organizationId, courseId, parseUpdate(await request.json()));
    return NextResponse.json({ course });
  } catch (error: unknown) { return errorResponse(error); }
}
