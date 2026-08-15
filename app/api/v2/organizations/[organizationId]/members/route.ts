import { NextResponse } from "next/server.js";
import { OrganizationAccessError } from "../../../../../../lib/v2/organization/types.ts";
import { OrganizationService } from "../../../../../../lib/v2/organization/service.ts";
import { PrismaOrganizationRepository } from "../../../../../../lib/v2/organization/repository-prisma.ts";
import { prismaV2 } from "../../../../../../lib/v2/prisma.ts";

function service() {
  return new OrganizationService(new PrismaOrganizationRepository(prismaV2));
}

function userId(request: Request) {
  const value = request.headers.get("x-loopit-user-id");
  if (!value) throw new Error("Authentication required.");
  return value;
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const actor = userId(request);
    const { organizationId } = await params;
    const members = await service().listMembers(organizationId, actor);
    return NextResponse.json({ members });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}
