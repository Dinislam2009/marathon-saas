import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryLessonRepository } from "./repository.ts";
import { LessonService } from "./service.ts";

test("LessonService creates, lists, reads and updates lessons", async () => {
  const service = new LessonService(new InMemoryLessonRepository());
  const startsAt = new Date("2026-09-01T10:00:00.000Z");
  const endsAt = new Date("2026-09-01T11:00:00.000Z");

  const lesson = await service.create({
    courseId: "course-1",
    groupId: "group-1",
    title: "Algebra",
    startsAt,
    endsAt,
  });

  assert.equal(lesson.title, "Algebra");
  assert.equal((await service.list("course-1", "group-1")).length, 1);
  assert.equal((await service.get("course-1", "group-1", lesson.id))?.id, lesson.id);

  const updated = await service.update("course-1", "group-1", lesson.id, {
    title: "Advanced Algebra",
  });
  assert.equal(updated.title, "Advanced Algebra");
});
