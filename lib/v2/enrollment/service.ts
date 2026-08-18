import { EnrollmentRepository } from "./repository";
import { EnrollmentRecord, CreateEnrollmentInput, UpdateEnrollmentInput } from "./types";

export class EnrollmentService {
  constructor(private readonly repository: EnrollmentRepository) {}

  async createEnrollment(input: CreateEnrollmentInput): Promise<EnrollmentRecord> {
    return this.repository.create(input);
  }

  async getEnrollment(organizationId: string, id: string): Promise<EnrollmentRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listEnrollments(
    organizationId: string,
    groupId?: string,
    studentId?: string
  ): Promise<EnrollmentRecord[]> {
    return this.repository.findMany(organizationId, groupId, studentId);
  }

  async updateEnrollment(
    organizationId: string,
    id: string,
    input: UpdateEnrollmentInput
  ): Promise<EnrollmentRecord> {
    return this.repository.update(organizationId, id, input);
  }

  async deleteEnrollment(organizationId: string, id: string): Promise<void> {
    return this.repository.delete(organizationId, id);
  }
}