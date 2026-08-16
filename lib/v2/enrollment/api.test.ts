import assert from "node:assert/strict";
import test from "node:test";
import { EnrollmentApiService } from "./api.ts";

const repository = {
  async findById(id: string) {
    return id === "e1" ? { id: "e1" } : null;
  },
  async findByStudentId(studentId: string) {
    return studentId === "s1" ? [{ id: "e1" }] : [];
  },
  async findByGroupId(groupId: string) {
    return groupId === "g1" ? [{ id: "e1" }] : [];
  },
};

test("gets enrollment by id", async () => {
  const service = new EnrollmentApiService(repository as never);
  assert.deepEqual(await service.getEnrollment("e1"), { id: "e1" });
});

test("gets student and group enrollments", async () => {
  const service = new EnrollmentApiService(repository as never);
  assert.deepEqual(await service.getStudentEnrollments("s1"), [{ id: "e1" }]);
  assert.deepEqual(await service.getGroupEnrollments("g1"), [{ id: "e1" }]);
});
