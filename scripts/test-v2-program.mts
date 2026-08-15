import { InMemoryProgramRepository } from "../lib/v2/program/repository";
import { ProgramService } from "../lib/v2/program/service";

const service = new ProgramService(new InMemoryProgramRepository());
const program = await service.createProgram({
  organizationId: "org-smoke",
  name: "Smoke Program",
  type: "COURSE",
});

if (program.status !== "DRAFT") throw new Error("Program default status mismatch");
if (program.organizationId !== "org-smoke") throw new Error("Program organization mismatch");

const found = await service.getProgram("org-smoke", program.id);
if (found.id !== program.id) throw new Error("Program read failed");

console.log("Program Core smoke test passed");
