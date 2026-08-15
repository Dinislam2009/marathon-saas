import type { PrismaClient } from "../../../generated/prisma-v2";
import type { CreateProgramInput, ProgramRecord, ProgramRepository, UpdateProgramInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaProgramRepository implements ProgramRepository {
  private readonly prisma: PrismaV2Client;

  constructor(prisma: PrismaV2Client) {
    this.prisma = prisma;
  }

  async create(input: CreateProgramInput): Promise<ProgramRecord> {
    return this.prisma.program.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description ?? null,
        type: input.type ?? "COURSE",
        status: input.status ?? "DRAFT",
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
      },
    });
  }

  async findById(organizationId: string, programId: string): Promise<ProgramRecord | null> {
    return this.prisma.program.findFirst({ where: { id: programId, organizationId } });
  }

  async list(organizationId: string): Promise<ProgramRecord[]> {
    return this.prisma.program.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
  }

  async update(organizationId: string, programId: string, input: UpdateProgramInput): Promise<ProgramRecord> {
    const existing = await this.findById(organizationId, programId);
    if (!existing) throw new Error("Program not found.");
    return this.prisma.program.update({ where: { id: programId }, data: input });
  }
}
