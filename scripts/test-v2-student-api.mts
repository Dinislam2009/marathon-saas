import "dotenv/config";
import { StudentService } from "../lib/v2/student/service";
import { PrismaStudentRepository } from "../lib/v2/student/repository-prisma";
import { prismaV2 } from "../lib/v2/prisma";

async function runStudentApiContractTests() {
  console.log("🚀 Starting Student API Contract Tests...");

  const studentRepo = new PrismaStudentRepository(prismaV2);
  const studentService = new StudentService(studentRepo);

  console.log("0. Creating Test Organizations in Database...");
  const timestamp = Date.now();

  const orgA = await prismaV2.organization.create({
    data: {
      name: `Test Org Student A ${timestamp}`,
      slug: `test-org-student-a-${timestamp}`,
    },
  });

  const orgB = await prismaV2.organization.create({
    data: {
      name: `Test Org Student B ${timestamp}`,
      slug: `test-org-student-b-${timestamp}`,
    },
  });

  try {
    // 1. POST /students - Студент тіркеу
    console.log("1. Testing Student Creation (POST)...");
    const createdStudent = await studentService.createStudent({
      organizationId: orgA.id,
      firstName: "Асан",
      lastName: "Әлібек",
      email: `asan.${timestamp}@test.kz`,
      phone: "+77071234567",
      status: "ACTIVE",
    });

    if (!createdStudent.id || createdStudent.organizationId !== orgA.id) {
      throw new Error("❌ Failed: Student creation invariant failed.");
    }
    console.log("✅ PASS: Student created successfully:", createdStudent.id);

    // 2. GET /students - Студенттер тізімін алу
    console.log("2. Testing Student Listing (GET)...");
    const students = await studentService.listStudents(orgA.id);
    if (students.length === 0 || !students.some((s) => s.id === createdStudent.id)) {
      throw new Error("❌ Failed: Created student not found in list.");
    }
    console.log("✅ PASS: Student listing retrieved successfully.");

    // 3. GET /students/:studentId - Жеке студентті алу
    console.log("3. Testing Get Single Student (GET)...");
    const fetchedStudent = await studentService.getStudent(orgA.id, createdStudent.id);
    if (!fetchedStudent || fetchedStudent.firstName !== "Асан") {
      throw new Error("❌ Failed: Single student retrieval mismatch.");
    }
    console.log("✅ PASS: Single student retrieved successfully.");

    // 4. PATCH /students/:studentId - Студент деректерін жаңарту
    console.log("4. Testing Student Update (PATCH)...");
    const updatedStudent = await studentService.updateStudent(orgA.id, createdStudent.id, {
      firstName: "Асан (Жаңартылған)",
      status: "INVITED",
    });
    if (updatedStudent.firstName !== "Асан (Жаңартылған)" || updatedStudent.status !== "INVITED") {
      throw new Error("❌ Failed: Student update failed.");
    }
    console.log("✅ PASS: Student updated successfully.");

    // 5. Cross-Organization Security Isolation Test
    console.log("5. Testing Cross-Organization Security Isolation...");
    const crossOrgStudent = await studentService.getStudent(orgB.id, createdStudent.id);
    if (crossOrgStudent !== null) {
      throw new Error(
        "🚨 SECURITY FAIL: Organization B was able to read Organization A's student!"
      );
    }
    console.log("✅ PASS: Cross-Organization Security Isolation verified.");

    console.log("\n🎉 ALL STUDENT API CONTRACT TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ TEST RUNNER FAILED:", error);
    process.exit(1);
  } finally {
    console.log("🧹 Cleaning up test data...");
    await prismaV2.student.deleteMany({
      where: { organizationId: { in: [orgA.id, orgB.id] } },
    });
    await prismaV2.organization.deleteMany({
      where: { id: { in: [orgA.id, orgB.id] } },
    });
    await prismaV2.$disconnect();
  }
}

runStudentApiContractTests();