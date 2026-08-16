import { NextResponse } from "next/server.js";
import { PrismaStudentRepository } from "../../../../../../lib/v2/student/repository-prisma.ts";
import { StudentService } from "../../../../../../lib/v2/student/service.ts";
import { STUDENT_STATUSES, type CreateStudentInput } from "../../../../../../lib/v2/student/types.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";

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

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(organizationId, actorId);
    return NextResponse.json({ students: await service().listStudents(organizationId) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = message === "Authentication required." ? 401 : message.includes("access") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(organizationId, actorId, true);
    const student = await service().createStudent(parseCreate(await request.json(), organizationId));
    return NextResponse.json({ student }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = message === "Authentication required." ? 401 : /access|permissions/.test(message) ? 403 : /required|Invalid|contain/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
