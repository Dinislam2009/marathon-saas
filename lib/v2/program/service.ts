import { PROGRAM_STATUSES, PROGRAM_TYPES, type CreateProgramInput, type ProgramRepository, type ProgramStatus, type ProgramType, type UpdateProgramInput } from "./types";

function normalizeText(value: string, field: string) {
  const normalized = value.trim();
  if (normalized.length < 2) throw new Error(`${field} must contain at least 2 characters.`);
  return normalized;
}

function normalizeOptional(value: string | null | undefined) {
  if (value === undefined || value === null) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function assertType(type: ProgramType) {
  if (!PROGRAM_TYPES.includes(type)) throw new Error(`Unsupported program type: ${type}`);
}

function assertStatus(status: ProgramStatus) {
  if (!PROGRAM_STATUSES.includes(status)) throw new Error(`Unsupported program status: ${status}`);
}

function assertDateRange(startDate: Date | null | undefined, endDate: Date | null | undefined) {
  if (startDate && endDate && startDate > endDate) throw new Error("Program start date cannot be after end date.");
}

export class ProgramService {
  private readonly repository: ProgramRepository;

  constructor(repository: ProgramRepository) {
    this.repository = repository;
  }

  async createProgram(input: CreateProgramInput) {
    const name = normalizeText(input.name, "Program name");
    const type = input.type ?? "COURSE";
    const status = input.status ?? "DRAFT";
    assertType(type);
    assertStatus(status);
    assertDateRange(input.startDate, input.endDate);
    return this.repository.create({ ...input, name, description: normalizeOptional(input.description), type, status });
  }

  async getProgram(organizationId: string, programId: string) {
    const program = await this.repository.findById(organizationId, programId);
    if (!program) throw new Error("Program not found.");
    return program;
  }

  async listPrograms(organizationId: string) {
    return this.repository.list(organizationId);
  }

  async updateProgram(organizationId: string, programId: string, input: UpdateProgramInput) {
    const existing = await this.repository.findById(organizationId, programId);
    if (!existing) throw new Error("Program not found.");
    const updateInput: UpdateProgramInput = { ...input };
    if (updateInput.name !== undefined) updateInput.name = normalizeText(updateInput.name, "Program name");
    if (updateInput.description !== undefined) updateInput.description = normalizeOptional(updateInput.description);
    if (updateInput.type !== undefined) assertType(updateInput.type);
    if (updateInput.status !== undefined) assertStatus(updateInput.status);
    assertDateRange(updateInput.startDate ?? existing.startDate, updateInput.endDate ?? existing.endDate);
    return this.repository.update(organizationId, programId, updateInput);
  }
}
