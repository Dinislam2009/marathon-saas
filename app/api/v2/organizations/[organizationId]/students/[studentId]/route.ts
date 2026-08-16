import { NextResponse } from "next/server.js";
import { PrismaStudentRepository } from "../../../../../../../lib/v2/student/repository-prisma.ts";
import { StudentService } from "../../../../../../../lib/v2/student/service.ts";
import { STUDENT_STATUSES, type UpdateStudentInput } from "../../../../../../../lib/v2/student/types.ts";
import { prismaV2 } from "../../../../../../../lib/v2/prisma.ts";
import { getActorId, organizationErrorResponse, requireOrganizationAccess } from "../../../../../../../lib/v2/organization/access.ts";

const STUDENT_WRITE_ROLES = ["OWNER", "ADMIN", "MANAGER", "CURATOR"] as const;

function parseUpdate(body: unknown): UpdateStudentInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }
  const value = body as Record<string, unknown>;
  const input: UpdateStudentInput = {};

  for (const key of ["firstName", "lastName", "phone", "email", "source", "notes"] as const) {
    const item = value[key];
    if (item !== undefined && item !== null && typeof item !== "string") {
      throw new Error(`${key} must be a string or null.`);
    }
    if (item !== undefined) input[key] = item as never;
  }

  if (value.dateOfBirth !== undefined) {
    if (value.dateOfBirth !== null && typeof value.dateOfBirth !== "string") throw new Error("dateOfBirth must be an ISO date string or null.");
    const date = value.dateOfBirth === null ? null : new Date(value.dateOfBirth as string);
    if (date instanceof Date && Number.isNaN(date.getTime())) throw new Error("dateOfBirth must be a valid ISO date.");
    input.dateOfBirth = date;
  }

  if (value.status !== undefined) {
    if (typeof value.status !== "string" || !STUDENT_STATUSES.includes(value.status as (typeof STUDENT_STATUSES)[number])) {
      throw new Error("Invalid student status.");
    }
    input.status = value.status as UpdateStudentInput["status"];
  }

  if (Object.keys(input).length === 0) throw new Error("At least one student field is required.");
  return input;
}

function service() {
  return new StudentService(new PrismaStudentRepository(prismaV2));
}

function errorResponse(error: unknown) {
  const { message, status } = organizationErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string; studentId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, studentId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId);
    const student = await service().getStudent(organizationId, studentId);
    return NextResponse.json({ student });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; studentId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, studentId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId, { write: true, writeRoles: STUDENT_WRITE_ROLES });
    const student = await service().updateStudent(organizationId, studentId, parseUpdate(await request.json()));
    return NextResponse.json({ student });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
