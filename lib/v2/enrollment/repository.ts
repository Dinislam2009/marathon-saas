import { EnrollmentRecord, CreateEnrollmentInput, UpdateEnrollmentInput } from "./types";

export interface EnrollmentRepository {
  create(input: CreateEnrollmentInput): Promise<EnrollmentRecord>;
  findById(organizationId: string, id: string): Promise<EnrollmentRecord | null>;
  findMany(organizationId: string, groupId?: string, studentId?: string): Promise<EnrollmentRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateEnrollmentInput
  ): Promise<EnrollmentRecord>;
  delete(organizationId: string, id: string): Promise<void>;
}