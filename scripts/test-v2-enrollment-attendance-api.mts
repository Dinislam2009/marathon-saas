import "dotenv/config";
import { EnrollmentService } from "../lib/v2/enrollment/service";
import { PrismaEnrollmentRepository } from "../lib/v2/enrollment/repository-prisma";
import { AttendanceService } from "../lib/v2/attendance/service";
import { PrismaAttendanceRepository } from "../lib/v2/attendance/repository-prisma";
import { StudentService } from "../lib/v2/student/service";
import { PrismaStudentRepository } from "../lib/v2/student/repository-prisma";
import { prismaV2 } from "../lib/v2/prisma";

async function runEnrollmentAttendanceTests() {
  console.log("🚀 Starting Enrollment & Attendance API Contract Tests...");

  const enrollmentService = new EnrollmentService(new PrismaEnrollmentRepository(prismaV2));
  const attendanceService = new AttendanceService(new PrismaAttendanceRepository(prismaV2));
  const studentService = new StudentService(new PrismaStudentRepository(prismaV2));

  console.log("0. Creating Prerequisites in Database...");
  const timestamp = Date.now();

  const orgA = await prismaV2.organization.create({
    data: { name: `Org Enroll A ${timestamp}`, slug: `org-enroll-a-${timestamp}` },
  });

  const orgB = await prismaV2.organization.create({
    data: { name: `Org Enroll B ${timestamp}`, slug: `org-enroll-b-${timestamp}` },
  });

  const studentA = await studentService.createStudent({
    organizationId: orgA.id,
    firstName: "Нұрлан",
    lastName: "Сабуров",
  });

  const programA = await prismaV2.program.create({
    data: { name: "Web Dev 2026 Program", organizationId: orgA.id },
  });

  const courseA = await prismaV2.course.create({
    data: { name: "Next.js Core Course", organizationId: orgA.id },
  });

  const groupA = await prismaV2.group.create({
    data: { name: "Alpha Group", organizationId: orgA.id, courseId: courseA.id },
  });

  const lessonStartTime = new Date();
  const lessonEndTime = new Date(lessonStartTime.getTime() + 60 * 60 * 1000);

const lessonA = await prismaV2.lesson.create({
    data: {
      title: "Lesson 1: Intro",
      courseId: courseA.id,
      groupId: groupA.id,
      startsAt: lessonStartTime,
      endsAt: lessonEndTime,
    },
  });

  try {
    // 1. Enrollment Test
    console.log("1. Testing Enrollment Creation...");
    const enrollment = await enrollmentService.createEnrollment({
      organizationId: orgA.id,
      studentId: studentA.id,
      programId: programA.id,
      groupId: groupA.id,
    });

    if (!enrollment.id) throw new Error("❌ Enrollment creation failed.");
    console.log("✅ PASS: Enrollment created:", enrollment.id);

    // 2. Attendance Test
    console.log("2. Testing Attendance Marking...");
    const attendance = await attendanceService.markAttendance({
      organizationId: orgA.id,
      studentId: studentA.id,
      lessonId: lessonA.id,
      groupId: groupA.id,
      status: "PRESENT",
      note: "Attended on time",
    });

    if (!attendance.id || attendance.status !== "PRESENT") {
      throw new Error("❌ Attendance marking failed.");
    }
    console.log("✅ PASS: Attendance marked:", attendance.id);

    // 3. Security Isolation
    console.log("3. Testing Security Isolation...");
    const crossOrgEnroll = await enrollmentService.getEnrollment(orgB.id, enrollment.id);
    if (crossOrgEnroll !== null) {
      throw new Error("🚨 SECURITY FAIL: Cross-org enrollment read detected!");
    }
    console.log("✅ PASS: Security Isolation verified.");

    console.log("\n🎉 ALL ENROLLMENT & ATTENDANCE TESTS PASSED!");
  } catch (error) {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
  } finally {
    console.log("🧹 Cleaning up test data...");
    await prismaV2.attendance.deleteMany({ where: { studentId: studentA.id } });
    await prismaV2.enrollment.deleteMany({ where: { studentId: studentA.id } });
    await prismaV2.lesson.deleteMany({ where: { id: lessonA.id } });
    await prismaV2.group.deleteMany({ where: { id: groupA.id } });
    await prismaV2.course.deleteMany({ where: { id: courseA.id } });
    await prismaV2.program.deleteMany({ where: { id: programA.id } });
    await prismaV2.student.deleteMany({ where: { id: studentA.id } });
    await prismaV2.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prismaV2.$disconnect();
  }
}

runEnrollmentAttendanceTests();