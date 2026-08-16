import { NextResponse } from "next/server.js";
import { PrismaProgramRepository } from "../../../../../../lib/v2/program/repository-prisma.ts";
import { ProgramService } from "../../../../../../lib/v2/program/service.ts";
import { PROGRAM_STATUSES, PROGRAM_TYPES, type CreateProgramInput } from "../../../../../../lib/v2/program/types.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";
import { getActorId, organizationErrorResponse, requireOrganizationAccess } from "../../../../../../lib/v2/organization/access.ts";

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
  const { message, status } = organizationErrorResponse(error);
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId);
    return NextResponse.json({ programs: await service().listPrograms(organizationId) });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actorId = getActorId(request);
    const { organizationId } = await params;
    await requireOrganizationAccess(prismaV2, organizationId, actorId, { write: true });
    const program = await service().createProgram(parseCreate(await request.json(), organizationId));
    return NextResponse.json({ program }, { status: 201 });
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
