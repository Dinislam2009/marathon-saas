import assert from "node:assert/strict";
import test from "node:test";
import { EnrollmentApiService } from "./api.ts";

const repository = {
  async findById(_organizationId: string, id: string) {
    return id === "e1" ? { id: "e1" } : null;
  },
  async list(_organizationId: string, studentId?: string, programId?: string) {
    if (studentId === "s1" || programId === "p1") return [{ id: "e1" }];
    return [];
  },
};

test("gets enrollment by id", async () => {
  const service = new EnrollmentApiService(repository as never);
  assert.deepEqual(await service.getEnrollment("org-1", "e1"), { id: "e1" });
});

test("lists enrollments by student or program", async () => {
  const service = new EnrollmentApiService(repository as never);
  assert.deepEqual(await service.listEnrollments("org-1", { studentId: "s1" }), [{ id: "e1" }]);
  assert.deepEqual(await service.listEnrollments("org-1", { programId: "p1" }), [{ id: "e1" }]);
});
