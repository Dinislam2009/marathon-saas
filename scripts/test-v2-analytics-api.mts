import "dotenv/config";
import { AnalyticsService } from "../lib/v2/analytics/service";
import { StudentService } from "../lib/v2/student/service";
import { PrismaStudentRepository } from "../lib/v2/student/repository-prisma";
import { AttendanceService } from "../lib/v2/attendance/service";
import { PrismaAttendanceRepository } from "../lib/v2/attendance/repository-prisma";
import { prismaV2 } from "../lib/v2/prisma";

async function runAnalyticsTests() {
  console.log("🚀 Starting Analytics API Contract Tests...");

  const analyticsService = new AnalyticsService(prismaV2);
  const studentService = new StudentService(new PrismaStudentRepository(prismaV2));
  const attendanceService = new AttendanceService(new PrismaAttendanceRepository(prismaV2));

  console.log("0. Creating Prerequisites in Database...");
  const timestamp = Date.now();

  const orgA = await prismaV2.organization.create({
    data: { name: `Org Analytics A ${timestamp}`, slug: `org-analytics-a-${timestamp}` },
  });

  const studentA = await studentService.createStudent({
    organizationId: orgA.id,
    firstName: "Ерасыл",
    lastName: "Қабдолла",
  });

  const courseA = await prismaV2.course.create({
    data: { name: "TypeScript Advanced", organizationId: orgA.id },
  });

  const groupA = await prismaV2.group.create({
    data: { name: "Omega Group", organizationId: orgA.id, courseId: courseA.id },
  });

  const now = new Date();
  const lessonA = await prismaV2.lesson.create({
    data: {
      title: "Lesson 1: Generics",
      courseId: courseA.id,
      groupId: groupA.id,
      startsAt: now,
      endsAt: new Date(now.getTime() + 60 * 60 * 1000),
    },
  });

  try {
    // 1. Mark Attendance
    console.log("1. Marking Attendance for Student...");
    await attendanceService.markAttendance({
      organizationId: orgA.id,
      studentId: studentA.id,
      lessonId: lessonA.id,
      groupId: groupA.id,
      status: "PRESENT",
    });

    // 2. Student Analytics Test
    console.log("2. Testing Student Analytics Calculations...");
    const stats = await analyticsService.getStudentAnalytics(orgA.id, studentA.id);

    if (stats.totalLessons !== 1 || stats.attendanceRate !== 100) {
      throw new Error(`❌ Invalid Analytics result: ${JSON.stringify(stats)}`);
    }
    console.log("✅ PASS: Student Analytics verified:", stats);

    console.log("\n🎉 ALL ANALYTICS TESTS PASSED!");
  } catch (error) {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
  } finally {
    console.log("🧹 Cleaning up test data...");
    await prismaV2.attendance.deleteMany({ where: { studentId: studentA.id } });
    await prismaV2.lesson.deleteMany({ where: { id: lessonA.id } });
    await prismaV2.group.deleteMany({ where: { id: groupA.id } });
    await prismaV2.course.deleteMany({ where: { id: courseA.id } });
    await prismaV2.student.deleteMany({ where: { id: studentA.id } });
    await prismaV2.organization.deleteMany({ where: { id: orgA.id } });
    await prismaV2.$disconnect();
  }
}

runAnalyticsTests();