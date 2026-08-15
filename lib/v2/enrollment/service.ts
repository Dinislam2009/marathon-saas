import { ENROLLMENT_STATUSES, type CreateEnrollmentInput, type EnrollmentRepository, type EnrollmentStatus, type UpdateEnrollmentInput } from "./types.ts";

function assertStatus(status: EnrollmentStatus) {
  if (!ENROLLMENT_STATUSES.includes(status)) throw new Error(`Unsupported enrollment status: ${status}`);
}

export class EnrollmentService {
  private readonly repository: EnrollmentRepository;

  constructor(repository: EnrollmentRepository) {
    this.repository = repository;
  }

  async createEnrollment(input: CreateEnrollmentInput) {
    const status = input.status ?? "ACTIVE";
    assertStatus(status);
    if (!input.studentId.trim()) throw new Error("Student is required.");
    if (!input.programId.trim()) throw new Error("Program is required.");
    return this.repository.create({ ...input, status });
  }

  async getEnrollment(organizationId: string, enrollmentId: string) {
    const enrollment = await this.repository.findById(organizationId, enrollmentId);
    if (!enrollment) throw new Error("Enrollment not found.");
    return enrollment;
  }

  async listEnrollments(organizationId: string, studentId?: string, programId?: string) {
    return this.repository.list(organizationId, studentId, programId);
  }

  async updateEnrollment(organizationId: string, enrollmentId: string, input: UpdateEnrollmentInput) {
    await this.getEnrollment(organizationId, enrollmentId);
    if (input.status !== undefined) assertStatus(input.status);
    if (input.status === "COMPLETED" && input.completedAt === undefined) input = { ...input, completedAt: new Date() };
    return this.repository.update(organizationId, enrollmentId, input);
  }
}
