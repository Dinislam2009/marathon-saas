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
// POST: Жаңа тапсырма қосу
export async function POST(request) {
  try {
    const body = await request.json();
    const { marathonId, title, description, dayNumber, points } = body;

    if (!marathonId || !title) {
      return NextResponse.json(
        { ok: false, error: "Marathon ID және Тапсырма атауы міндетті" },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        marathonId,
        title,
        description: description || "",
        dayNumber: Number(dayNumber) || 1,
        points: Number(points) || 10,
      },
    });

    return NextResponse.json({ ok: true, task: newTask });
  } catch (error) {
    console.error("API /api/org/tasks POST error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}