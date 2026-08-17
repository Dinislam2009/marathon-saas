import { NextResponse } from "next/server";
import { GroupService } from "@/lib/v2/group/service";
import { PrismaGroupRepository } from "@/lib/v2/group/repository-prisma";
import { prismaV2 } from "@/lib/v2/prisma";

const groupService = new GroupService(new PrismaGroupRepository(prismaV2));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; groupId: string }> }
) {
  try {
    const { organizationId, groupId } = await params;
    const group = await groupService.getGroup(organizationId, groupId);

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("GET /groups/[groupId] error:", error);
    return NextResponse.json({ error: "Failed to fetch group" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ organizationId: string; groupId: string }> }
) {
  try {
    const { organizationId, groupId } = await params;
    const body = await request.json();

    const updatedGroup = await groupService.updateGroup(organizationId, groupId, {
      name: body.name,
      capacity: body.capacity ? Number(body.capacity) : undefined,
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("PATCH /groups/[groupId] error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ organizationId: string; groupId: string }> }
) {
  try {
    const { organizationId, groupId } = await params;
    await groupService.deleteGroup(organizationId, groupId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /groups/[groupId] error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}