import "dotenv/config";
import { LessonService } from "../lib/v2/lesson/service";
import { PrismaLessonRepository } from "../lib/v2/lesson/repository-prisma";
import { HomeworkService } from "../lib/v2/homework/service";
import { PrismaHomeworkRepository } from "../lib/v2/homework/repository-prisma";
import { prismaV2 } from "../lib/v2/prisma";

async function runLessonHomeworkTests() {
  console.log("🚀 Starting Lesson & Homework API Contract Tests...");

  const lessonService = new LessonService(new PrismaLessonRepository(prismaV2));
  const homeworkService = new HomeworkService(new PrismaHomeworkRepository(prismaV2));

  console.log("0. Creating Prerequisites in Database...");
  const timestamp = Date.now();

  const orgA = await prismaV2.organization.create({
    data: { name: `Org Lesson A ${timestamp}`, slug: `org-lesson-a-${timestamp}` },
  });

  const orgB = await prismaV2.organization.create({
    data: { name: `Org Lesson B ${timestamp}`, slug: `org-lesson-b-${timestamp}` },
  });

  const courseA = await prismaV2.course.create({
    data: { name: "Fullstack Next.js Course", organizationId: orgA.id },
  });

  const groupA = await prismaV2.group.create({
    data: { name: "Beta Group", organizationId: orgA.id, courseId: courseA.id },
  });

  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + 90 * 60 * 1000); // 1.5 сағат

  try {
    // 1. Lesson Creation Test
    console.log("1. Testing Lesson Creation...");
    const lesson = await lessonService.createLesson({
      title: "Clean Architecture in Next.js",
      description: "Prisma V2 & Core Services setup",
      startsAt: startTime,
      endsAt: endTime,
      courseId: courseA.id,
      groupId: groupA.id,
    });

    if (!lesson.id) throw new Error("❌ Lesson creation failed.");
    console.log("✅ PASS: Lesson created:", lesson.id);

    // 2. Homework Creation Test
    console.log("2. Testing Homework Creation...");
    const homework = await homeworkService.createHomework({
      title: "Implement Lesson & Homework Services",
      description: "Write unit & contract tests for V2 API",
      lessonId: lesson.id,
    });

    if (!homework.id) throw new Error("❌ Homework creation failed.");
    console.log("✅ PASS: Homework created:", homework.id);

    // 3. Security Isolation Test
    console.log("3. Testing Security Isolation...");
    const crossOrgLesson = await lessonService.getLesson(orgB.id, lesson.id);
    const crossOrgHomework = await homeworkService.getHomework(orgB.id, homework.id);

    if (crossOrgLesson !== null || crossOrgHomework !== null) {
      throw new Error("🚨 SECURITY FAIL: Cross-org data access detected!");
    }
    console.log("✅ PASS: Security Isolation verified.");

    console.log("\n🎉 ALL LESSON & HOMEWORK TESTS PASSED!");
  } catch (error) {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
  } finally {
    console.log("🧹 Cleaning up test data...");
    await prismaV2.homework.deleteMany({ where: { lesson: { courseId: courseA.id } } });
    await prismaV2.lesson.deleteMany({ where: { courseId: courseA.id } });
    await prismaV2.group.deleteMany({ where: { id: groupA.id } });
    await prismaV2.course.deleteMany({ where: { id: courseA.id } });
    await prismaV2.organization.deleteMany({ where: { id: { in: [orgA.id, orgB.id] } } });
    await prismaV2.$disconnect();
  }
}

runLessonHomeworkTests();