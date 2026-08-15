import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryCourseRepository } from "./repository.ts";
import { CourseService } from "./service.ts";

describe("CourseService", () => {
  it("creates and lists courses by organization and program", async () => {
    const service = new CourseService(new InMemoryCourseRepository());
    await service.createCourse({ organizationId: "org-1", programId: "program-1", name: " Math Basics " });
    await service.createCourse({ organizationId: "org-1", programId: "program-2", name: "Physics" });

    assert.equal((await service.listCourses("org-1")).length, 2);
    assert.equal((await service.listCourses("org-1", "program-1")).length, 1);
    assert.equal((await service.listCourses("org-2")).length, 0);
  });

  it("prevents cross-organization reads and updates", async () => {
    const service = new CourseService(new InMemoryCourseRepository());
    const course = await service.createCourse({ organizationId: "org-a", programId: "program-a", name: "Math" });

    await assert.rejects(() => service.getCourse("org-b", course.id), /Course not found\./);
    await assert.rejects(() => service.updateCourse("org-b", course.id, { name: "Hacked" }), /Course not found\./);
  });

  it("validates course names", async () => {
    const service = new CourseService(new InMemoryCourseRepository());
    await assert.rejects(
      () => service.createCourse({ organizationId: "org-1", programId: "program-1", name: " x " }),
      /Course name must contain at least 2 characters/i,
    );
  });
});
