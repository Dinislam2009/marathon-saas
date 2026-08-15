import { InMemoryCourseRepository } from "../lib/v2/course/repository.ts";
import { CourseService } from "../lib/v2/course/service.ts";

const service = new CourseService(new InMemoryCourseRepository());
const course = await service.createCourse({
  organizationId: "org-smoke",
  programId: "program-smoke",
  name: "Smoke Course",
});

if (course.organizationId !== "org-smoke") throw new Error("Course organization mismatch");
if (course.programId !== "program-smoke") throw new Error("Course program mismatch");

const found = await service.getCourse("org-smoke", course.id);
if (found.id !== course.id) throw new Error("Course read failed");

console.log("Course Core smoke test passed");
