import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryEnrollmentRepository } from "./repository.ts";
import { EnrollmentService } from "./service.ts";

describe("EnrollmentService", () => {
  it("creates and lists an enrollment", async () => {
    const service = new EnrollmentService(new InMemoryEnrollmentRepository());
    const enrollment = await service.createEnrollment({ studentId: "student-1", programId: "program-1", groupId: "group-1" });
    assert.equal(enrollment.status, "ACTIVE");
    assert.equal((await service.listEnrollments("org-1", "student-1")).length, 1);
  });

  it("sets completion time when completing", async () => {
    const service = new EnrollmentService(new InMemoryEnrollmentRepository());
    const enrollment = await service.createEnrollment({ studentId: "student-1", programId: "program-1" });
    const updated = await service.updateEnrollment("org-1", enrollment.id, { status: "COMPLETED" });
    assert.equal(updated.status, "COMPLETED");
    assert.ok(updated.completedAt instanceof Date);
  });

  it("rejects missing student or program", async () => {
    const service = new EnrollmentService(new InMemoryEnrollmentRepository());
    await assert.rejects(() => service.createEnrollment({ studentId: "", programId: "program-1" }), /Student is required/);
    await assert.rejects(() => service.createEnrollment({ studentId: "student-1", programId: "" }), /Program is required/);
  });
});
