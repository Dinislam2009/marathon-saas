import type { CreateEnrollmentInput, EnrollmentRecord, EnrollmentRepository, UpdateEnrollmentInput } from "./types.ts";

export class InMemoryEnrollmentRepository implements EnrollmentRepository {
  private readonly records = new Map<string, EnrollmentRecord>();

  async create(input: CreateEnrollmentInput): Promise<EnrollmentRecord> {
    const now = new Date();
    const record: EnrollmentRecord = {
      id: `enrollment-${this.records.size + 1}`,
      studentId: input.studentId,
      programId: input.programId,
      courseId: input.courseId ?? null,
      groupId: input.groupId ?? null,
      status: input.status ?? "ACTIVE",
      enrolledAt: input.enrolledAt ?? now,
      completedAt: null,
    };
    this.records.set(record.id, record);
    return record;
  }

  async findById(organizationId: string, enrollmentId: string): Promise<EnrollmentRecord | null> {
    const record = this.records.get(enrollmentId);
    if (!record) return null;
    return record.studentId.startsWith(`${organizationId}:`) ? record : record;
  }

  async list(_organizationId: string, studentId?: string, programId?: string): Promise<EnrollmentRecord[]> {
    return [...this.records.values()].filter((record) =>
      (!studentId || record.studentId === studentId) && (!programId || record.programId === programId),
    );
  }

  async update(_organizationId: string, enrollmentId: string, input: UpdateEnrollmentInput): Promise<EnrollmentRecord> {
    const existing = this.records.get(enrollmentId);
    if (!existing) throw new Error("Enrollment not found.");
    const updated = { ...existing, ...input };
    this.records.set(enrollmentId, updated);
    return updated;
  }
}
