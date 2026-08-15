import { NextResponse } from "next/server.js";
import { OrganizationAccessError, type OrganizationRepository } from "../../../../../lib/v2/organization/types.ts";
import { OrganizationService } from "../../../../../lib/v2/organization/service.ts";
import { PrismaOrganizationRepository } from "../../../../../lib/v2/organization/repository-prisma.ts";
import { prismaV2 } from "../../../../../lib/v2/prisma.ts";

function getService() {
  return new OrganizationService(new PrismaOrganizationRepository(prismaV2));
}

function getUserId(request: Request) {
  const userId = request.headers.get("x-loopit-user-id");
  if (!userId) throw new Error("Authentication required.");
  return userId;
}

function parseUpdate(body: unknown): Parameters<OrganizationRepository["updateOrganization"]>[1] {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be an object.");
  const source = body as Record<string, unknown>;
  const allowed = ["name", "slug", "logoUrl", "phone", "email", "address", "timezone", "currency"] as const;
  const input: Record<string, unknown> = {};
  for (const key of allowed) if (key in source) input[key] = source[key];
  if (Object.keys(input).length === 0) throw new Error("At least one organization field is required.");
  for (const [key, value] of Object.entries(input)) if (value !== null && typeof value !== "string") throw new Error(`${key} must be a string or null.`);
  return input as Parameters<OrganizationRepository["updateOrganization"]>[1];
}

export async function GET(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const userId = getUserId(request);
    const { organizationId } = await params;
    const organization = await getService().getOrganization(organizationId, userId);
    if (!organization) return NextResponse.json({ error: "Organization not found." }, { status: 404 });
    return NextResponse.json({ organization });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: message === "Authentication required." ? 401 : 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ organizationId: string }> }) {
  try {
    const userId = getUserId(request);
    const { organizationId } = await params;
    const body = await request.json();
    const organization = await getService().updateOrganization(organizationId, userId, parseUpdate(body));
    return NextResponse.json({ organization });
  } catch (error: unknown) {
    if (error instanceof OrganizationAccessError) return NextResponse.json({ error: error.message }, { status: 403 });
    const message = error instanceof Error ? error.message : "Internal server error.";
    const status = /required|must be|must contain|already in use/.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
