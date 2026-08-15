import { InMemoryEnrollmentRepository } from "../lib/v2/enrollment/repository.ts";
import { EnrollmentService } from "../lib/v2/enrollment/service.ts";

const service = new EnrollmentService(new InMemoryEnrollmentRepository());
const enrollment = await service.createEnrollment({ studentId: "student-smoke", programId: "program-smoke", courseId: "course-smoke" });
if (enrollment.status !== "ACTIVE") throw new Error("Enrollment default status mismatch");
if (enrollment.studentId !== "student-smoke") throw new Error("Enrollment student mismatch");
console.log("Enrollment Core smoke test passed");
