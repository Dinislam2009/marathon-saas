export const ENROLLMENT_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export type EnrollmentRecord = {
  id: string; studentId: string; programId: string; courseId: string | null; groupId: string | null;
  status: EnrollmentStatus; enrolledAt: Date; completedAt: Date | null;
};

export type CreateEnrollmentInput = { studentId: string; programId: string; courseId?: string | null; groupId?: string | null; status?: EnrollmentStatus; enrolledAt?: Date };
export type UpdateEnrollmentInput = { courseId?: string | null; groupId?: string | null; status?: EnrollmentStatus; completedAt?: Date | null };

export interface EnrollmentRepository {
  create(input: CreateEnrollmentInput): Promise<EnrollmentRecord>;
  findById(organizationId: string, enrollmentId: string): Promise<EnrollmentRecord | null>;
  list(organizationId: string, studentId?: string, programId?: string): Promise<EnrollmentRecord[]>;
  update(organizationId: string, enrollmentId: string, input: UpdateEnrollmentInput): Promise<EnrollmentRecord>;
}
