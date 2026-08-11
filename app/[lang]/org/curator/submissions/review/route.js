import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const { submissionId, status, studentId, points } = await req.json();

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Деректер толық емес / Данные неполные" }, 
        { status: 400 }
      );
    }

    // 1. Есеп статусын жаңарту
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { status },
    });

    // 2. Егер есеп ҚАБЫЛДАНСА — оқушыға ұпай (XP) қосу
    if (status === "APPROVED" && studentId && points) {
      await prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: Number(points) || 0 } },
      });
    }

    return NextResponse.json({ ok: true, submission: updatedSubmission });
  } catch (error) {
    console.error("curator review API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}