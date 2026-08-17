import { Enrollment as PrismaEnrollment, EnrollmentStatus } from "../../../generated/prisma-v2";

export type EnrollmentRecord = PrismaEnrollment;

export interface CreateEnrollmentInput {
  organizationId: string;
  studentId: string;
  programId: string;
  groupId?: string;
  status?: EnrollmentStatus;
}

export interface UpdateEnrollmentInput {
  status?: EnrollmentStatus;
}