import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryStudentRepository } from "./repository";
import { StudentService } from "./service";

const repo = () => new InMemoryStudentRepository();

describe("StudentService", () => {
  it("creates and lists students inside one organization", async () => {
    const service = new StudentService(repo());
    const created = await service.createStudent({ organizationId: "org-1", firstName: "Aruzhan", lastName: "Sarsenova", email: "aruzhan@example.com" });
    assert.equal(created.firstName, "Aruzhan");
    assert.equal(created.status, "ACTIVE");
    const students = await service.listStudents("org-1");
    assert.equal(students.length, 1);
    assert.equal(students[0]?.id, created.id);
  });

  it("prevents cross-organization reads and updates", async () => {
    const service = new StudentService(repo());
    const created = await service.createStudent({ organizationId: "org-a", firstName: "Dias", lastName: "Bekov" });
    await assert.rejects(() => service.getStudent("org-b", created.id), /Student not found\./);
    await assert.rejects(() => service.updateStudent("org-b", created.id, { notes: "no access" }), /Student not found\./);
  });

  it("normalizes student names and optional fields", async () => {
    const service = new StudentService(repo());
    const created = await service.createStudent({ organizationId: "org-1", firstName: "  Ayan  ", lastName: "  Nurlan  ", phone: "   ", notes: "  strong student  " });
    assert.equal(created.firstName, "Ayan");
    assert.equal(created.lastName, "Nurlan");
    assert.equal(created.phone, null);
    assert.equal(created.notes, "strong student");
  });
});
