import { NextResponse } from "next/server.js";
import { OrganizationAccessError } from "../../../../../../lib/v2/organization/types.ts";
import { OrganizationService } from "../../../../../../lib/v2/organization/service.ts";
import { PrismaOrganizationRepository } from "../../../../../../lib/v2/organization/repository-prisma.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";
import { CourseService } from "../../../../../../lib/v2/course/service.ts";
import { PrismaCourseRepository } from "../../../../../../lib/v2/course/repository-prisma.ts";
import type { UpdateCourseInput } from "../../../../../../lib/v2/course/types.ts";

function getServices() {
  return {
    organization: new OrganizationService(new PrismaOrganizationRepository(prismaV2)),
    course: new CourseService(new PrismaCourseRepository(prismaV2)),
  };
}

function getUserId(request: Request) {
  const userId = request.headers.get("x-loopit-user-id");
  if (!userId) throw new Error("Authentication required.");
  return userId;
}

function parseUpdate(body: unknown): UpdateCourseInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be an object.");
  const source = body as Record<string, unknown>;
  const input: UpdateCourseInput = {};
  if ("name" in source) {
    if (typeof source.name !== "string") throw new Error("name must be a string.");
    input.name = source.name;
  }
  if ("description" in source) {
    if (source.description !== null && typeof source.description !== "string") throw new Error("description must be a string or null.");
    input.description = source.description as string | null;
  }
  if (Object.keys(input).length === 0) throw new Error("At least one course field is required.");
  return input;
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string; courseId: string }> }) {
  try {
    const userId = getUserId(request);
    const { organizationId, courseId } = await params;
    const { organization, course } = getServices();
    const access = await organization.getOrganization(organizationId, userId);
    if (!access) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    const result = await course.getCourse(organizationId, courseId);
    return NextResponse.json({ course: result });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : message === "Course not found." ? 404 : 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; courseId: string }> }) {
  try {
    const userId = getUserId(request);
    const { organizationId, courseId } = await params;
    const body = await request.json();
    const { organization, course } = getServices();
    const access = await organization.getOrganization(organizationId, userId);
    if (!access) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    const result = await course.updateCourse(organizationId, courseId, parseUpdate(body));
    return NextResponse.json({ course: result });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = message === "Authentication required." ? 401 : message === "Course not found." ? 404 : /required|must be|at least/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
