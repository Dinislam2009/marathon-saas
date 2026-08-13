import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    const whereClause = orgId && orgId !== "orgId" ? { organizerId: orgId } : {};

    const marathons = await prisma.marathon.findMany({
      where: whereClause,
      select: { id: true, title: true },
    });

    const marathonIds = marathons.map((m) => m.id);

    const groups = await prisma.group.findMany({
      where: marathonIds.length > 0 ? { marathonId: { in: marathonIds } } : {},
      include: {
        marathon: { select: { id: true, title: true } },
        curator: { select: { id: true, name: true, email: true } },
        students: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const curators = await prisma.curator.findMany({
      where: whereClause,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      ok: true,
      groups,
      marathons,
      curators,
    });
  } catch (error) {
    console.error("API /api/org/groups GET error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}