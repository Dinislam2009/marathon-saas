import { NextResponse } from "next/server.js";
import { PrismaProgramRepository } from "../../../../../../lib/v2/program/repository-prisma.ts";
import { ProgramService } from "../../../../../../lib/v2/program/service.ts";
import { PROGRAM_STATUSES, PROGRAM_TYPES, type CreateProgramInput } from "../../../../../../lib/v2/program/types.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";

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

function parseDate(value: unknown, field: string) {
  if (value === undefined || value === null) return value === null ? null : undefined;
  if (typeof value !== "string") throw new Error(`${field} must be an ISO date string or null.`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid ISO date.`);
  return date;
}

function parseCreate(body: unknown, organizationId: string): CreateProgramInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Request body must be a JSON object.");
  }
  const value = body as Record<string, unknown>;
  if (typeof value.name !== "string") throw new Error("name is required.");

  const type = value.type === undefined ? undefined : value.type;
  if (type !== undefined && (typeof type !== "string" || !PROGRAM_TYPES.includes(type as (typeof PROGRAM_TYPES)[number]))) {
    throw new Error("Invalid program type.");
  }

  const status = value.status === undefined ? undefined : value.status;
  if (status !== undefined && (typeof status !== "string" || !PROGRAM_STATUSES.includes(status as (typeof PROGRAM_STATUSES)[number]))) {
    throw new Error("Invalid program status.");
  }

  return {
    organizationId,
    name: value.name,
    description: typeof value.description === "string" ? value.description : value.description === null ? null : undefined,
    type: type as CreateProgramInput["type"],
    status: status as CreateProgramInput["status"],
    startDate: parseDate(value.startDate, "startDate"),
    endDate: parseDate(value.endDate, "endDate"),
  };
}

function service() {
  return new ProgramService(new PrismaProgramRepository(prismaV2));
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error.";
  const status = message === "Authentication required." ? 401 : /access|permissions/.test(message) ? 403 : /required|Invalid|must |Unsupported|cannot be/.test(message) ? 400 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(organizationId, actorId);
    return NextResponse.json({ programs: await service().listPrograms(organizationId) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(organizationId, actorId, true);
    const program = await service().createProgram(parseCreate(await request.json(), organizationId));
    return NextResponse.json({ program }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
