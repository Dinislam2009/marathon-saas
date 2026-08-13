import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const marathonId = searchParams.get("marathonId");

    if (!marathonId) {
      return NextResponse.json(
        { ok: false, error: "Marathon ID керек" },
        { status: 400 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: { marathonId },
      orderBy: { dayNumber: "asc" },
    });

    return NextResponse.json({ ok: true, tasks });
  } catch (error) {
    console.error("API /api/org/tasks GET error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}