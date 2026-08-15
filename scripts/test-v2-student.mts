import { InMemoryStudentRepository } from "../lib/v2/student/repository";
import { StudentService } from "../lib/v2/student/service";

const service = new StudentService(new InMemoryStudentRepository());

const student = await service.createStudent({
  organizationId: "org-smoke",
  firstName: "Test",
  lastName: "Student",
});

if (student.organizationId !== "org-smoke") throw new Error("Student organization mismatch");
if (student.status !== "ACTIVE") throw new Error("Student default status mismatch");

const found = await service.getStudent("org-smoke", student.id);
if (found.id !== student.id) throw new Error("Student read failed");

console.log("Student Core smoke test passed");
