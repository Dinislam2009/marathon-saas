import { NextResponse } from "next/server.js";
import { PrismaStudentRepository } from "../../../../../../lib/v2/student/repository-prisma.ts";
import { StudentService } from "../../../../../../lib/v2/student/service.ts";
import { STUDENT_STATUSES, type CreateStudentInput } from "../../../../../../lib/v2/student/types.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";
import { getActorId, organizationErrorResponse, requireOrganizationAccess } from "../../../../../../lib/v2/organization/access.ts";

const STUDENT_WRITE_ROLES = ["OWNER", "ADMIN", "MANAGER", "CURATOR"] as const;

function parseCreate(body: unknown, organizationId: string): CreateStudentInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }
  const value = body as Record<string, unknown>;
  if (typeof value.firstName !== "string" || typeof value.lastName !== "string") {
    throw new Error("firstName and lastName are required.");
  }

  const status = value.status === undefined ? undefined : value.status;
  if (status !== undefined && (typeof status !== "string" || !STUDENT_STATUSES.includes(status as (typeof STUDENT_STATUSES)[number]))) {
    throw new Error("Invalid student status.");
  }

  return {
    organizationId,
    firstName: value.firstName,
    lastName: value.lastName,
    phone: typeof value.phone === "string" ? value.phone : value.phone === null ? null : undefined,
    email: typeof value.email === "string" ? value.email : value.email === null ? null : undefined,
    dateOfBirth: typeof value.dateOfBirth === "string" ? new Date(value.dateOfBirth) : value.dateOfBirth === null ? null : undefined,
    status: status as CreateStudentInput["status"],
    source: typeof value.source === "string" ? value.source : value.source === null ? null : undefined,
    notes: typeof value.notes === "string" ? value.notes : value.notes === null ? null : undefined,
  };
}

function service() {
  return new StudentService(new PrismaStudentRepository(prismaV2));
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
    return NextResponse.json({ students: await service().listStudents(organizationId) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId, { write: true, writeRoles: STUDENT_WRITE_ROLES });
    const student = await service().createStudent(parseCreate(await request.json(), organizationId));
    return NextResponse.json({ student }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
