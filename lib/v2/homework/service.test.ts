import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryHomeworkRepository } from "./repository.ts";
import { HomeworkService } from "./service.ts";

test("HomeworkService creates, lists, reads and updates homework", async () => {
  const service = new HomeworkService(new InMemoryHomeworkRepository());
  const deadline = new Date("2026-09-05T18:00:00.000Z");

  const homework = await service.create({
    lessonId: "lesson-1",
    title: "Algebra practice",
    deadline,
    status: "PUBLISHED",
  });

  assert.equal(homework.title, "Algebra practice");
  assert.equal(homework.status, "PUBLISHED");
  assert.equal((await service.list("lesson-1")).length, 1);
  assert.equal((await service.get("lesson-1", homework.id))?.id, homework.id);

  const updated = await service.update("lesson-1", homework.id, {
    title: "Advanced algebra practice",
  });
  assert.equal(updated.title, "Advanced algebra practice");
});
