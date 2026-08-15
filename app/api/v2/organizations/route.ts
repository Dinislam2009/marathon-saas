import { NextResponse } from "next/server";
import { parseCreateOrganizationRequest } from "../../../../../lib/v2/organization/api.ts";
import { OrganizationAccessError, OrganizationService } from "../../../../../lib/v2/organization/service.ts";
import { PrismaOrganizationRepository } from "../../../../../lib/v2/organization/repository-prisma.ts";
import { prismaV2 } from "../../../../../lib/v2/prisma.ts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ownerUserId = request.headers.get("x-loopit-user-id");
    const input = parseCreateOrganizationRequest(body, ownerUserId);

    const user = await prismaV2.user.findUnique({ where: { id: input.ownerUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const service = new OrganizationService(new PrismaOrganizationRepository(prismaV2));
    const organization = await service.createOrganization(input);

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    if (error instanceof OrganizationAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = /already in use|must contain|is required|Authentication required|Request body/.test(message)
      ? 400
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
