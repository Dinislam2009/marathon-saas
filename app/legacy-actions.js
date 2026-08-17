"use server";

import * as auth from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function sendResetOtp(identifier) {
  return auth.sendResetOtp(identifier);
}

export async function resetPasswordWithOtp(userId, code, newPassword) {
  return auth.resetPasswordWithOtp({ userId, code, newPassword });
}

export async function reviewSubmission({ submissionId, status, studentId, points }) {
  if (!submissionId) return { ok: false, error: "Submission ID is required." };

  const normalizedStatus = String(status || "").toUpperCase();
  if (!["PENDING", "SUBMITTED", "APPROVED", "REJECTED", "MISSED"].includes(normalizedStatus)) {
    return { ok: false, error: "Invalid submission status." };
  }

  const submission = await prisma.submission.findUnique({
    where: { id: String(submissionId) },
    select: { id: true, studentId: true },
  });

  if (!submission) return { ok: false, error: "Submission not found." };
  if (studentId && String(studentId) !== String(submission.studentId)) {
    return { ok: false, error: "Student does not match submission." };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.submission.update({
      where: { id: String(submissionId) },
      data: { status: normalizedStatus },
    });

    if (normalizedStatus === "APPROVED" && Number(points) > 0) {
      await tx.student.update({
        where: { id: submission.studentId },
        data: { points: { increment: Number(points) } },
      });
    }

    return result;
  });

  return { ok: true, submission: updated };
}
