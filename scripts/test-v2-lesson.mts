import { InMemoryLessonRepository } from "../lib/v2/lesson/repository.ts";
import { LessonService } from "../lib/v2/lesson/service.ts";

const service = new LessonService(new InMemoryLessonRepository());
const startsAt = new Date("2026-09-01T10:00:00.000Z");
const endsAt = new Date("2026-09-01T11:00:00.000Z");

const lesson = await service.create({
  courseId: "course-smoke",
  groupId: "group-smoke",
  title: "Smoke Lesson",
  startsAt,
  endsAt,
});

if (lesson.courseId !== "course-smoke") throw new Error("Lesson course mismatch");
if (lesson.groupId !== "group-smoke") throw new Error("Lesson group mismatch");
if (lesson.title !== "Smoke Lesson") throw new Error("Lesson title mismatch");

const found = await service.get("course-smoke", "group-smoke", lesson.id);
if (!found || found.id !== lesson.id) throw new Error("Lesson read failed");

console.log("Lesson Core smoke test passed");
