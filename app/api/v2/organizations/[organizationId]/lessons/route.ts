import { NextResponse } from "next/server";
import { LessonService } from "@/lib/v2/lesson/service";
import { PrismaLessonRepository } from "@/lib/v2/lesson/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const lessonService = new LessonService(new PrismaLessonRepository(prismaV2));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") || undefined;
    const groupId = searchParams.get("groupId") || undefined;

    const lessons = await lessonService.listLessons(organizationId, courseId, groupId);
    return NextResponse.json({ success: true, data: lessons });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const body = await request.json();

    const lesson = await lessonService.createLesson({
      title: body.title,
      description: body.description,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      courseId: body.courseId,
      groupId: body.groupId,
    });

    return NextResponse.json({ success: true, data: lesson }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}