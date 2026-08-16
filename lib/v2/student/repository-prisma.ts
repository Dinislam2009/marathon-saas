import type { PrismaClient } from "../../../generated/prisma-v2/index.js";
import type { CreateStudentInput, StudentRecord, StudentRepository, UpdateStudentInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaStudentRepository implements StudentRepository {
  private readonly prisma: PrismaV2Client;

  constructor(prisma: PrismaV2Client) {
    this.prisma = prisma;
  }

  async create(input: CreateStudentInput): Promise<StudentRecord> {
    return this.prisma.student.create({
      data: {
        organizationId: input.organizationId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        dateOfBirth: input.dateOfBirth ?? null,
        status: input.status ?? "ACTIVE",
        source: input.source ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  async findById(organizationId: string, studentId: string): Promise<StudentRecord | null> {
    return this.prisma.student.findFirst({ where: { id: studentId, organizationId } });
  }

  async list(organizationId: string): Promise<StudentRecord[]> {
    return this.prisma.student.findMany({ where: { organizationId }, orderBy: { createdAt: "asc" } });
  }

  async update(organizationId: string, studentId: string, input: UpdateStudentInput): Promise<StudentRecord> {
    return this.prisma.student.update({ where: { id: studentId, organizationId }, data: input });
  }
}
