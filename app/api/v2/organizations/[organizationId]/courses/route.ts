import { NextResponse } from "next/server.js";
import { OrganizationAccessError } from "../../../../../lib/v2/organization/types.ts";
import { OrganizationService } from "../../../../../lib/v2/organization/service.ts";
import { PrismaOrganizationRepository } from "../../../../../lib/v2/organization/repository-prisma.ts";
import { prismaV2 } from "../../../../../lib/v2/prisma.ts";
import { CourseService } from "../../../../../lib/v2/course/service.ts";
import { PrismaCourseRepository } from "../../../../../lib/v2/course/repository-prisma.ts";
import type { CreateCourseInput } from "../../../../../lib/v2/course/types.ts";

function getServices() {
  const organization = new OrganizationService(new PrismaOrganizationRepository(prismaV2));
  const course = new CourseService(new PrismaCourseRepository(prismaV2));
  return { organization, course };
}

function getUserId(request: Request) {
  const userId = request.headers.get("x-loopit-user-id");
  if (!userId) throw new Error("Authentication required.");
  return userId;
}

function parseCreate(body: unknown): Omit<CreateCourseInput, "organizationId"> {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be an object.");
  const source = body as Record<string, unknown>;
  if (typeof source.programId !== "string" || !source.programId.trim()) throw new Error("programId is required.");
  if (typeof source.name !== "string") throw new Error("name must be a string.");
  if (source.description !== undefined && source.description !== null && typeof source.description !== "string") {
    throw new Error("description must be a string or null.");
  }
  return {
    programId: source.programId.trim(),
    name: source.name,
    description: source.description as string | null | undefined,
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const userId = getUserId(request);
    const { organizationId } = await params;
    const url = new URL(request.url);
    const programId = url.searchParams.get("programId") ?? undefined;
    const { organization, course } = getServices();
    const access = await organization.getOrganization(organizationId, userId);
    if (!access) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    return NextResponse.json({ courses: await course.listCourses(organizationId, programId) });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const userId = getUserId(request);
    const { organizationId } = await params;
    const body = await request.json();
    const { organization, course } = getServices();
    const access = await organization.getOrganization(organizationId, userId);
    if (!access) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    const input = parseCreate(body);
    const program = await prismaV2.program.findFirst({ where: { id: input.programId, organizationId } });
    if (!program) return NextResponse.json({ error: "Program not found." }, { status: 404 });
    const created = await course.createCourse({ ...input, organizationId });
    return NextResponse.json({ course: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = /required|must be|at least/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
