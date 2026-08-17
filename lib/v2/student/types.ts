import { Student as PrismaStudent, UserStatus } from "../../../generated/prisma-v2";

export type StudentRecord = PrismaStudent;
export type StudentStatus = UserStatus;

export interface CreateStudentInput {
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | null;
  status?: StudentStatus;
  source?: string | null;
  notes?: string | null;
  groupId?: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | null;
  status?: StudentStatus;
  source?: string | null;
  notes?: string | null;
  groupId?: string;
}