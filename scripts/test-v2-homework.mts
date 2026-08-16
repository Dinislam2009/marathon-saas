import { InMemoryHomeworkRepository } from "../lib/v2/homework/repository.ts";
import { HomeworkService } from "../lib/v2/homework/service.ts";

const service = new HomeworkService(new InMemoryHomeworkRepository());
const homework = await service.create({
  lessonId: "lesson-smoke",
  title: "Homework smoke test",
});

if (homework.status !== "DRAFT") {
  throw new Error(`Expected DRAFT status, got ${homework.status}`);
}

console.log("Homework V2 smoke test passed.");
