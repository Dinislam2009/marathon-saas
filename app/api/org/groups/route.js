import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    const groups = await prisma.group.findMany({
      where: orgId && orgId !== "main" 
        ? { marathon: { organizerId: String(orgId) } } 
        : {},
      include: {
        marathon: { select: { id: true, title: true } },
        curator: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(groups);
  } catch (error) {
    console.error("API /api/org/groups GET error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}