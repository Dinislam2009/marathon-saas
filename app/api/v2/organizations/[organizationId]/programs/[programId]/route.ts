import { NextResponse } from "next/server.js";
import { PrismaProgramRepository } from "../../../../../../../lib/v2/program/repository-prisma.ts";
import { ProgramService } from "../../../../../../../lib/v2/program/service.ts";
import { PROGRAM_STATUSES, PROGRAM_TYPES, type UpdateProgramInput } from "../../../../../../../lib/v2/program/types.ts";
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

function parseDate(value: unknown, field: string) {
  if (value === undefined || value === null) return value === null ? null : undefined;
  if (typeof value !== "string") throw new Error(`${field} must be an ISO date string or null.`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${field} must be a valid ISO date.`);
  return date;
}

function parseUpdate(body: unknown): UpdateProgramInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be a JSON object.");
  const source = body as Record<string, unknown>;
  const input: Record<string, unknown> = {};
  for (const key of ["name", "description", "type", "status", "startDate", "endDate"] as const) {
    if (key in source) input[key] = source[key];
  }
  if (Object.keys(input).length === 0) throw new Error("At least one program field is required.");
  if (input.name !== undefined && typeof input.name !== "string") throw new Error("name must be a string.");
  if (input.description !== undefined && input.description !== null && typeof input.description !== "string") throw new Error("description must be a string or null.");
  if (input.type !== undefined && (typeof input.type !== "string" || !PROGRAM_TYPES.includes(input.type as (typeof PROGRAM_TYPES)[number]))) throw new Error("Invalid program type.");
  if (input.status !== undefined && (typeof input.status !== "string" || !PROGRAM_STATUSES.includes(input.status as (typeof PROGRAM_STATUSES)[number]))) throw new Error("Invalid program status.");
  if ("startDate" in input) input.startDate = parseDate(input.startDate, "startDate");
  if ("endDate" in input) input.endDate = parseDate(input.endDate, "endDate");
  return input as UpdateProgramInput;
}

function service() {
  return new ProgramService(new PrismaProgramRepository(prismaV2));
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error.";
  const status = message === "Authentication required." ? 401 : /access|permissions/.test(message) ? 403 : /required|Invalid|must |Unsupported|cannot be/.test(message) ? 400 : message === "Program not found." ? 404 : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string; programId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, programId } = await params;
    await requireOrganizationAccess(organizationId, actorId);
    return NextResponse.json({ program: await service().getProgram(organizationId, programId) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; programId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId, programId } = await params;
    await requireOrganizationAccess(organizationId, actorId, true);
    const program = await service().updateProgram(organizationId, programId, parseUpdate(await request.json()));
    return NextResponse.json({ program });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
