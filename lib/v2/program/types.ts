export const PROGRAM_TYPES = ["COURSE", "EXAM_PREP", "MARATHON", "INTENSIVE", "CLUB", "OTHER"] as const;
export const PROGRAM_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;

export type ProgramType = (typeof PROGRAM_TYPES)[number];
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export interface ProgramRecord {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: ProgramType;
  status: ProgramStatus;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProgramInput {
  organizationId: string;
  name: string;
  description?: string | null;
  type?: ProgramType;
  status?: ProgramStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface UpdateProgramInput {
  name?: string;
  description?: string | null;
  type?: ProgramType;
  status?: ProgramStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface ProgramRepository {
  create(input: CreateProgramInput): Promise<ProgramRecord>;
  findById(organizationId: string, programId: string): Promise<ProgramRecord | null>;
  list(organizationId: string): Promise<ProgramRecord[]>;
  update(organizationId: string, programId: string, input: UpdateProgramInput): Promise<ProgramRecord>;
}

export const PROGRAM_CORE_VERSION = "v2";
