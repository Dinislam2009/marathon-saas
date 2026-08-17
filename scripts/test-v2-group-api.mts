import "dotenv/config";
import { GroupService } from "../lib/v2/group/service";
import { PrismaGroupRepository } from "../lib/v2/group/repository-prisma";
import { CourseService } from "../lib/v2/course/service";
import { PrismaCourseRepository } from "../lib/v2/course/repository-prisma";
import { prismaV2 } from "../lib/v2/prisma";

async function runGroupApiContractTests() {
  console.log("🚀 Starting Group API Contract Tests...");

  const groupRepo = new PrismaGroupRepository(prismaV2);
  const groupService = new GroupService(groupRepo);

  const courseRepo = new PrismaCourseRepository(prismaV2);
  const courseService = new CourseService(courseRepo);

  console.log("0. Creating Test Organizations & Course in Database...");
  const timestamp = Date.now();

  const orgA = await prismaV2.organization.create({
    data: {
      name: `Test Org Group A ${timestamp}`,
      slug: `test-org-group-a-${timestamp}`,
    },
  });

  const orgB = await prismaV2.organization.create({
    data: {
      name: `Test Org Group B ${timestamp}`,
      slug: `test-org-group-b-${timestamp}`,
    },
  });

  const courseA = await courseService.createCourse({
    organizationId: orgA.id,
    name: "React & Next.js Core Course",
  });

  try {
    // 1. POST /groups - Жаңа топ құру
    console.log("1. Testing Group Creation (POST)...");
    const createdGroup = await groupService.createGroup({
      organizationId: orgA.id,
      courseId: courseA.id,
      name: "Group Alpha 2026",
      capacity: 25,
    });

    if (!createdGroup.id || createdGroup.organizationId !== orgA.id) {
      throw new Error("❌ Failed: Group creation invariant failed.");
    }
    console.log("✅ PASS: Group created successfully:", createdGroup.id);

    // 2. GET /groups - Топтар тізімін алу
    console.log("2. Testing Group Listing (GET)...");
    const groups = await groupService.listGroups(orgA.id, courseA.id);
    if (groups.length === 0 || !groups.some((g) => g.id === createdGroup.id)) {
      throw new Error("❌ Failed: Created group not found in list.");
    }
    console.log("✅ PASS: Group listing retrieved successfully.");

    // 3. GET /groups/:groupId - Жеке топты алу
    console.log("3. Testing Get Single Group (GET)...");
    const fetchedGroup = await groupService.getGroup(orgA.id, createdGroup.id);
    if (!fetchedGroup || fetchedGroup.name !== "Group Alpha 2026") {
      throw new Error("❌ Failed: Single group retrieval mismatch.");
    }
    console.log("✅ PASS: Single group retrieved successfully.");

    // 4. PATCH /groups/:groupId - Топты жаңарту
    console.log("4. Testing Group Update (PATCH)...");
    const updatedGroup = await groupService.updateGroup(orgA.id, createdGroup.id, {
      name: "Group Alpha 2026 (Updated)",
      capacity: 30,
    });
    if (updatedGroup.name !== "Group Alpha 2026 (Updated)" || updatedGroup.capacity !== 30) {
      throw new Error("❌ Failed: Group update failed.");
    }
    console.log("✅ PASS: Group updated successfully.");

    // 5. Cross-Organization Security Isolation Test
    console.log("5. Testing Cross-Organization Security Isolation...");
    const crossOrgGroup = await groupService.getGroup(orgB.id, createdGroup.id);
    if (crossOrgGroup !== null) {
      throw new Error(
        "🚨 SECURITY FAIL: Organization B was able to read Organization A's group!"
      );
    }
    console.log("✅ PASS: Cross-Organization Security Isolation verified.");

    console.log("\n🎉 ALL GROUP API CONTRACT TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
  } finally {
    console.log("🧹 Cleaning up test data...");
    await prismaV2.group.deleteMany({
      where: { organizationId: { in: [orgA.id, orgB.id] } },
    });
    await prismaV2.course.deleteMany({
      where: { organizationId: { in: [orgA.id, orgB.id] } },
    });
    await prismaV2.organization.deleteMany({
      where: { id: { in: [orgA.id, orgB.id] } },
    });
    await prismaV2.$disconnect();
  }
}

runGroupApiContractTests();