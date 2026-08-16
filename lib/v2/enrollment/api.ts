import type { EnrollmentRepository } from "./types.ts";

export class EnrollmentApiService {
  constructor(private readonly repository: EnrollmentRepository) {}

  async getEnrollment(organizationId: string, enrollmentId: string) {
    return this.repository.findById(organizationId, enrollmentId);
  }

  async listEnrollments(organizationId: string, filters?: { studentId?: string; programId?: string }) {
    return this.repository.list(organizationId, filters?.studentId, filters?.programId);
  }
}
