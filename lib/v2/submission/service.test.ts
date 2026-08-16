import assert from "node:assert/strict";
import test from "node:test";
import { InMemorySubmissionRepository } from "./repository.ts";
import { SubmissionService } from "./service.ts";

test("creates and submits homework submission", async () => {
  const repository = new InMemorySubmissionRepository();
  const service = new SubmissionService(repository);

  const created = await service.create({ homeworkId: "homework-1", studentId: "student-1", content: "answer" });
  assert.equal(created.status, "PENDING");

  const submitted = await service.submit(created.id);
  assert.equal(submitted.status, "SUBMITTED");
  assert.ok(submitted.submittedAt instanceof Date);
});

test("reviews a submitted homework submission", async () => {
  const repository = new InMemorySubmissionRepository();
  const service = new SubmissionService(repository);

  const created = await service.create({ homeworkId: "homework-2", studentId: "student-2" });
  await service.submit(created.id);
  const reviewed = await service.review(created.id, { grade: 95, feedback: "Good work" });

  assert.equal(reviewed.status, "REVIEWED");
  assert.equal(reviewed.grade, 95);
  assert.equal(reviewed.feedback, "Good work");
});
