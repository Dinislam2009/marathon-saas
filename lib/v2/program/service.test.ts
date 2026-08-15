import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { InMemoryProgramRepository } from "./repository.ts";
import { ProgramService } from "./service.ts";

describe("ProgramService", () => {
  it("creates and lists programs inside one organization", async () => {
    const service = new ProgramService(new InMemoryProgramRepository());
    const program = await service.createProgram({
      organizationId: "org-1",
      name: "ҰБТ 2027",
      description: "Exam preparation program",
      type: "EXAM_PREP",
    });

    assert.equal(program.status, "DRAFT");
    assert.equal(program.type, "EXAM_PREP");
    assert.equal((await service.listPrograms("org-1")).length, 1);
  });

  it("prevents cross-organization reads and updates", async () => {
    const service = new ProgramService(new InMemoryProgramRepository());
    const program = await service.createProgram({ organizationId: "org-a", name: "Math" });

    await assert.rejects(() => service.getProgram("org-b", program.id), /Program not found\./);
    await assert.rejects(
      () => service.updateProgram("org-b", program.id, { name: "Hacked" }),
      /Program not found\./,
    );
  });

  it("rejects an invalid date range", async () => {
    const service = new ProgramService(new InMemoryProgramRepository());
    await assert.rejects(
      () =>
        service.createProgram({
          organizationId: "org-1",
          name: "Invalid",
          startDate: new Date("2027-05-02"),
          endDate: new Date("2027-05-01"),
        }),
      /start date cannot be after end date/i,
    );
  });
});
