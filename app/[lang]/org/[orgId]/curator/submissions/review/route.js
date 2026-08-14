import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    const body = await req.json();
    const { submissionId, status, studentId, points } = body || {};

    if (!submissionId || !status) {
      return NextResponse.json(
        { error: "Деректер толық емес / Данные неполные" }, 
        { status: 400 }
      );
    }

    const pointsToAdd = Math.max(0, Number(points) || 0);

    // 1. Транзакция арқылы екі операцияны атомарлы түрде орындау
    const updatedSubmission = await prisma.$transaction(async (tx) => {
      // Есеп статусын жаңарту
      const submission = await tx.submission.update({
        where: { id: submissionId },
        data: { status },
      });

      // Егер есеп ҚАБЫЛДАНСА — оқушыға ұпай (XP) қосу
      // (studentId келмей қалса, есептің өзінен studentId ала салады)
      const targetStudentId = studentId || submission.studentId;
      if (status === "APPROVED" && targetStudentId && pointsToAdd > 0) {
        await tx.student.update({
          where: { id: targetStudentId },
          data: { points: { increment: pointsToAdd } },
        });
      }

      return submission;
    });

    return NextResponse.json({ ok: true, submission: updatedSubmission });
  } catch (error) {
    console.error("curator review API error:", error);
    return NextResponse.json(
      { error: error?.message || "Серверлік қате орын алды" }, 
      { status: 500 }
    );
  }
}