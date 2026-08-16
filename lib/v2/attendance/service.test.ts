import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryAttendanceRepository } from "./repository.ts";
import { AttendanceService } from "./service.ts";

test("AttendanceService creates, lists, reads and updates attendance", async () => {
  const service = new AttendanceService(new InMemoryAttendanceRepository());

  const attendance = await service.create({
    lessonId: "lesson-1",
    studentId: "student-1",
    status: "PRESENT",
  });

  assert.equal(attendance.status, "PRESENT");
  assert.equal((await service.listByLesson("lesson-1")).length, 1);
  assert.equal((await service.get("lesson-1", "student-1"))?.id, attendance.id);

  const updated = await service.update("lesson-1", "student-1", {
    status: "LATE",
    note: "Arrived after start",
  });
  assert.equal(updated.status, "LATE");
  assert.equal(updated.note, "Arrived after start");
});
