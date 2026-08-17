import { NextResponse } from "next/server";
import { HomeworkService } from "@/lib/v2/homework/service";
import { PrismaHomeworkRepository } from "@/lib/v2/homework/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const homeworkService = new HomeworkService(new PrismaHomeworkRepository(prismaV2));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get("lessonId") || undefined;

    const homeworks = await homeworkService.listHomeworks(organizationId, lessonId);
    return NextResponse.json({ success: true, data: homeworks });
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

    const homework = await homeworkService.createHomework({
      title: body.title,
      description: body.description,
      lessonId: body.lessonId,
    });

    return NextResponse.json({ success: true, data: homework }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}