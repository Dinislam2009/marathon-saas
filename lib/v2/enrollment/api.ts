import type { EnrollmentRepository } from "./types.ts";

export class EnrollmentApiService {
  constructor(private readonly repository: EnrollmentRepository) {}

  async getEnrollment(id: string) {
    return this.repository.findById(id);
  }

  async getStudentEnrollments(studentId: string) {
    return this.repository.findByStudentId(studentId);
  }

  async getGroupEnrollments(groupId: string) {
    return this.repository.findByGroupId(groupId);
  }
}
