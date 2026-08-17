"use server";

import { prisma } from "@/lib/prisma";

function safeJson(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function getStudentProgress(studentId) {
  try {
    if (!studentId) {
      return { ok: false, error: "Student ID көрсетілмеген." };
    }

    const student = await prisma.student.findUnique({
      where: { id: String(studentId) },
      include: {
        marathon: true,
        submissions: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!student) {
      return { ok: false, error: "Оқушы табылмады." };
    }

    return {
      ok: true,
      data: safeJson({
        student,
        marathon: student.marathon,
        allSubmissions: student.submissions,
      }),
    };
  } catch (error) {
    console.error("getStudentProgress error:", error);
    return {
      ok: false,
      error: error?.message || "Оқушы прогресін жүктеу кезінде қате шықты.",
    };
  }
}

export async function getStudentsByMarathonId(marathonId) {
  try {
    if (!marathonId) return [];

    const students = await prisma.student.findMany({
      where: { marathonId: String(marathonId) },
      include: {
        curator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    return safeJson(
      students.map((student) => ({
        ...student,
        name: student.name,
        email: student.email,
        points: student.points,
        status: student.status,
        curator: student.curator,
        curatorName: student.curator?.name || null,
      }))
    );
  } catch (error) {
    console.error("getStudentsByMarathonId error:", error);
    return [];
  }
}
