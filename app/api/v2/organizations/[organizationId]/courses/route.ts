import { NextResponse } from "next/server";
import { CourseService } from "@/lib/v2/course/service";
import { PrismaCourseRepository } from "@/lib/v2/course/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const courseRepository = new PrismaCourseRepository(prismaV2);
const courseService = new CourseService(courseRepository);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const courses = await courseService.listCourses(organizationId);
    return NextResponse.json({ data: courses });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();

    const course = await courseService.createCourse({
      ...body,
      organizationId,
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message } },
      { status: 400 }
    );
  }
}