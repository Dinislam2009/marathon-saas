import { NextResponse } from "next/server.js";
import { PrismaStudentRepository } from "../../../../../../../lib/v2/student/repository-prisma.ts";
import { StudentService } from "../../../../../../../lib/v2/student/service.ts";
import { STUDENT_STATUSES, type UpdateStudentInput } from "../../../../../../../lib/v2/student/types.ts";
import { prismaV2 } from "../../../../../../../lib/v2/prisma.ts";

const WRITE_ROLES = ["OWNER", "ADMIN", "MANAGER", "CURATOR"] as const;

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
    input.dateOfBirth = value.dateOfBirth === null ? null : new Date(value.dateOfBirth as string);
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

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string; studentId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, studentId } = await params;
    await requireOrganizationAccess(organizationId, actorId);
    const student = await service().getStudent(organizationId, studentId);
    return NextResponse.json({ student });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = message === "Authentication required." ? 401 : /access|not found/.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; studentId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, studentId } = await params;
    await requireOrganizationAccess(organizationId, actorId, true);
    const student = await service().updateStudent(organizationId, studentId, parseUpdate(await request.json()));
    return NextResponse.json({ student });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = message === "Authentication required." ? 401 : /access|permissions/.test(message) ? 403 : /required|Invalid|contain|must be/.test(message) ? 400 : /not found/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
