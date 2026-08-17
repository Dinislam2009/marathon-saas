import "dotenv/config";
import { CourseService } from "../lib/v2/course/service";
import { PrismaCourseRepository } from "../lib/v2/course/repository-prisma";
import { prismaV2 } from "../lib/v2/prisma";

async function runCourseApiContractTests() {
  console.log("🚀 Starting Course API Contract Tests...");

  const repository = new PrismaCourseRepository(prismaV2);
  const service = new CourseService(repository);

  console.log("0. Creating Test Organizations in Database...");
  const timestamp = Date.now();

  const orgA = await prismaV2.organization.create({
    data: {
      name: `Test Org A ${timestamp}`,
      slug: `test-org-a-${timestamp}`,
    },
  });

  const orgB = await prismaV2.organization.create({
    data: {
      name: `Test Org B ${timestamp}`,
      slug: `test-org-b-${timestamp}`,
    },
  });

  const orgAId = orgA.id;
  const orgBId = orgB.id;

  try {
    // 1. POST /courses - Жаңа курс құру
    console.log("1. Testing Course Creation (POST)...");
    const createdCourse = await service.createCourse({
      organizationId: orgAId,
      name: "Frontend React & Next.js Core",
      code: "REACT-101",
      description: "Comprehensive React course",
    });

    if (!createdCourse.id || createdCourse.organizationId !== orgAId) {
      throw new Error("❌ Failed: Course creation invariant failed.");
    }
    console.log("✅ PASS: Course created successfully:", createdCourse.id);

    // 2. GET /courses - Курстар тізімін алу
    console.log("2. Testing Course Listing (GET)...");
    const courses = await service.listCourses(orgAId);
    if (courses.length === 0 || !courses.some((c) => c.id === createdCourse.id)) {
      throw new Error("❌ Failed: Created course not found in organization list.");
    }
    console.log("✅ PASS: Course listing retrieved successfully.");

    // 3. GET /courses/:courseId - Жеке курсты алу
    console.log("3. Testing Get Single Course (GET)...");
    const fetchedCourse = await service.getCourse(orgAId, createdCourse.id);
    if (!fetchedCourse || fetchedCourse.name !== "Frontend React & Next.js Core") {
      throw new Error("❌ Failed: Single course retrieval mismatch.");
    }
    console.log("✅ PASS: Single course retrieved successfully.");

    // 4. PATCH /courses/:courseId - Курсты жаңарту
    console.log("4. Testing Course Update (PATCH)...");
    const updatedCourse = await service.updateCourse(orgAId, createdCourse.id, {
      name: "Frontend React & Next.js Advanced v2",
    });
    if (updatedCourse.name !== "Frontend React & Next.js Advanced v2") {
      throw new Error("❌ Failed: Course update failed.");
    }
    console.log("✅ PASS: Course updated successfully.");

    // 5. Cross-Organization Isolation Test
    console.log("5. Testing Cross-Organization Security Isolation...");
    const crossOrgCourse = await service.getCourse(orgBId, createdCourse.id);
    if (crossOrgCourse !== null) {
      throw new Error(
        "🚨 SECURITY FAIL: Organization B was able to read Organization A's course!"
      );
    }
    console.log("✅ PASS: Cross-Organization Security Isolation verified.");

    console.log("\n🎉 ALL COURSE API CONTRACT TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
  } finally {
    console.log("🧹 Cleaning up test organizations...");
    await prismaV2.course.deleteMany({
      where: { organizationId: { in: [orgAId, orgBId] } },
    });
    await prismaV2.organization.deleteMany({
      where: { id: { in: [orgAId, orgBId] } },
    });
    await prismaV2.$disconnect();
  }
}

runCourseApiContractTests();