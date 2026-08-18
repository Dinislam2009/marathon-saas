import { NextResponse } from "next/server";
import { CourseService } from "@/lib/v2/course/service";
import { PrismaCourseRepository } from "@/lib/v2/course/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const courseRepository = new PrismaCourseRepository(prismaV2);
const courseService = new CourseService(courseRepository);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; courseId: string }> }
) {
  try {
    const { organizationId, courseId } = await params;
    const course = await courseService.getCourse(organizationId, courseId);

    if (!course) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Course not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; courseId: string }> }
) {
  try {
    const { organizationId, courseId } = await params;
    const body = await request.json();

    const updatedCourse = await courseService.updateCourse(
      organizationId,
      courseId,
      body
    );

    return NextResponse.json({ data: updatedCourse });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message } },
      { status: 400 }
    );
  }
}