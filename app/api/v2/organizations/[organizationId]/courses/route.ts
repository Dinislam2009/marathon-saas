import { NextResponse } from "next/server.js";
import { PrismaCourseRepository } from "../../../../../../lib/v2/course/repository-prisma.ts";
import { CourseService } from "../../../../../../lib/v2/course/service.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";
import { getActorId, organizationErrorResponse, requireOrganizationAccess } from "../../../../../../lib/v2/organization/access.ts";

function errorResponse(error: unknown) {
  const { message, status } = organizationErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}

function parseCreate(body: unknown, organizationId: string) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be a JSON object.");
  const value = body as Record<string, unknown>;
  if (typeof value.programId !== "string" || value.programId.trim().length === 0) throw new Error("programId is required.");
  if (typeof value.name !== "string") throw new Error("name is required.");
  if (value.description !== undefined && value.description !== null && typeof value.description !== "string") throw new Error("description must be a string or null.");
  return { organizationId, programId: value.programId, name: value.name, description: typeof value.description === "string" ? value.description : value.description === null ? null : undefined };
}

function service() { return new CourseService(new PrismaCourseRepository(prismaV2)); }

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId);
    const programId = new URL(request.url).searchParams.get("programId") ?? undefined;
    return NextResponse.json({ courses: await service().listCourses(organizationId, programId) });
  } catch (error: unknown) { return errorResponse(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId, { write: true });
    const course = await service().createCourse(parseCreate(await request.json(), organizationId));
    return NextResponse.json({ course }, { status: 201 });
  } catch (error: unknown) { return errorResponse(error); }
}
