import { PrismaClient } from "../../../generated/prisma-v2";
import { StudentRepository } from "./repository";
import { StudentRecord, CreateStudentInput, UpdateStudentInput } from "./types";

export class PrismaStudentRepository implements StudentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateStudentInput): Promise<StudentRecord> {
    return this.prisma.student.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        dateOfBirth: input.dateOfBirth,
        status: input.status,
        source: input.source,
        notes: input.notes,
        organization: {
          connect: { id: input.organizationId },
        },
        ...(input.groupId
          ? { group: { connect: { id: input.groupId } } }
          : {}),
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<StudentRecord | null> {
    return this.prisma.student.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async findMany(organizationId: string, groupId?: string): Promise<StudentRecord[]> {
    return this.prisma.student.findMany({
      where: {
        organizationId,
        ...(groupId ? { groupId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateStudentInput
  ): Promise<StudentRecord> {
    return this.prisma.student.update({
      where: {
        id,
        organizationId,
      },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        dateOfBirth: input.dateOfBirth,
        status: input.status,
        source: input.source,
        notes: input.notes,
        ...(input.groupId
          ? { group: { connect: { id: input.groupId } } }
          : {}),
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.student.delete({
      where: {
        id,
        organizationId,
      },
    });
  }
}