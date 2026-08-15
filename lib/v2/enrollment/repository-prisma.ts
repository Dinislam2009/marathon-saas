import type { PrismaClient } from "../../../generated/prisma-v2";
import type { CreateEnrollmentInput, EnrollmentRecord, EnrollmentRepository, UpdateEnrollmentInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  private readonly prisma: PrismaV2Client;
  constructor(prisma: PrismaV2Client) { this.prisma = prisma; }

  async create(input: CreateEnrollmentInput): Promise<EnrollmentRecord> {
    return this.prisma.enrollment.create({ data: {
      studentId: input.studentId, programId: input.programId, courseId: input.courseId ?? null,
      groupId: input.groupId ?? null, status: input.status ?? "ACTIVE", enrolledAt: input.enrolledAt ?? new Date(),
    } });
  }

  async findById(_organizationId: string, enrollmentId: string): Promise<EnrollmentRecord | null> {
    return this.prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  }

  async list(_organizationId: string, studentId?: string, programId?: string): Promise<EnrollmentRecord[]> {
    return this.prisma.enrollment.findMany({ where: { ...(studentId ? { studentId } : {}), ...(programId ? { programId } : {}) }, orderBy: { enrolledAt: "asc" } });
  }

  async update(_organizationId: string, enrollmentId: string, input: UpdateEnrollmentInput): Promise<EnrollmentRecord> {
    return this.prisma.enrollment.update({ where: { id: enrollmentId }, data: input });
  }
}
