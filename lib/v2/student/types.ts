export const STUDENT_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED", "ARCHIVED"] as const;

export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export interface StudentRecord {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | null;
  status: StudentStatus;
  source?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

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
}

export interface StudentRepository {
  create(input: CreateStudentInput): Promise<StudentRecord>;
  findById(organizationId: string, studentId: string): Promise<StudentRecord | null>;
  list(organizationId: string): Promise<StudentRecord[]>;
  update(organizationId: string, studentId: string, input: UpdateStudentInput): Promise<StudentRecord>;
}
