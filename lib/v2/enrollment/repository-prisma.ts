import { PrismaClient } from "../../../generated/prisma-v2";
import { EnrollmentRepository } from "./repository";
import { EnrollmentRecord, CreateEnrollmentInput, UpdateEnrollmentInput } from "./types";

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateEnrollmentInput): Promise<EnrollmentRecord> {
    return this.prisma.enrollment.create({
      data: {
        student: { connect: { id: input.studentId } },
        program: { connect: { id: input.programId } },
        ...(input.groupId ? { group: { connect: { id: input.groupId } } } : {}),
        ...(input.status ? { status: input.status } : {}),
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<EnrollmentRecord | null> {
    return this.prisma.enrollment.findFirst({
      where: {
        id,
        student: { organizationId },
      },
    });
  }

  async findMany(
    organizationId: string,
    groupId?: string,
    studentId?: string
  ): Promise<EnrollmentRecord[]> {
    return this.prisma.enrollment.findMany({
      where: {
        student: { organizationId },
        ...(groupId ? { groupId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { id: "desc" },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateEnrollmentInput
  ): Promise<EnrollmentRecord> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Enrollment record not found");
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Enrollment record not found");
    }

    await this.prisma.enrollment.delete({
      where: { id },
    });
  }
}