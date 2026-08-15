import type { CreateProgramInput, ProgramRecord, ProgramRepository, UpdateProgramInput } from "./types";

export class InMemoryProgramRepository implements ProgramRepository {
  private readonly programs = new Map<string, ProgramRecord>();

  async create(input: CreateProgramInput): Promise<ProgramRecord> {
    const now = new Date();
    const program: ProgramRecord = {
      id: `program-${this.programs.size + 1}`,
      organizationId: input.organizationId,
      name: input.name,
      description: input.description ?? null,
      type: input.type ?? "COURSE",
      status: input.status ?? "DRAFT",
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.programs.set(program.id, program);
    return program;
  }

  async findById(organizationId: string, programId: string): Promise<ProgramRecord | null> {
    const program = this.programs.get(programId);
    return program?.organizationId === organizationId ? program : null;
  }

  async list(organizationId: string): Promise<ProgramRecord[]> {
    return [...this.programs.values()].filter((program) => program.organizationId === organizationId);
  }

  async update(organizationId: string, programId: string, input: UpdateProgramInput): Promise<ProgramRecord> {
    const existing = await this.findById(organizationId, programId);
    if (!existing) throw new Error("Program not found.");
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.programs.set(programId, updated);
    return updated;
  }
}
