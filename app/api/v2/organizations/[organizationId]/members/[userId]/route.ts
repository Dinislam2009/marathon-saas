import { NextResponse } from "next/server.js";
import { MEMBERSHIP_ROLES, OrganizationAccessError, type MembershipRole } from "../../../../../../../lib/v2/organization/types.ts";
import { OrganizationService } from "../../../../../../../lib/v2/organization/service.ts";
import { PrismaOrganizationRepository } from "../../../../../../../lib/v2/organization/repository-prisma.ts";
import { prismaV2 } from "../../../../../../../lib/v2/prisma.ts";

function service() {
  return new OrganizationService(new PrismaOrganizationRepository(prismaV2));
}

function actorId(request: Request) {
  const value = request.headers.get("x-loopit-user-id");
  if (!value) throw new Error("Authentication required.");
  return value;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string; userId: string }> }) {
  try {
    const actor = actorId(request);
    const { organizationId, userId } = await params;
    const body = await request.json();
    const role = body?.role;
    if (typeof role !== "string" || !MEMBERSHIP_ROLES.includes(role as MembershipRole)) {
      return NextResponse.json({ error: "A valid membership role is required." }, { status: 400 });
    }
    const membership = await service().changeMemberRole(organizationId, actor, userId, role as MembershipRole);
    return NextResponse.json({ membership });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ organizationId: string; userId: string }> }) {
  try {
    const actor = actorId(request);
    const { organizationId, userId } = await params;
    await service().removeMember(organizationId, actor, userId);
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
