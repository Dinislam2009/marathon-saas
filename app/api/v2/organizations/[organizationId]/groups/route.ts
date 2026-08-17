import { NextResponse } from "next/server";
import { GroupService } from "@/lib/v2/group/service";
import { PrismaGroupRepository } from "@/lib/v2/group/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const groupService = new GroupService(new PrismaGroupRepository(prismaV2));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId") || undefined;

    const groups = await groupService.listGroups(organizationId, courseId);
    return NextResponse.json(groups);
  } catch (error) {
    console.error("GET /groups error:", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const body = await request.json();

    if (!body.courseId || !body.name) {
      return NextResponse.json(
        { error: "courseId and name are required" },
        { status: 400 }
      );
    }

    const group = await groupService.createGroup({
      organizationId,
      courseId: body.courseId,
      name: body.name,
      capacity: body.capacity ? Number(body.capacity) : undefined,
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("POST /groups error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}