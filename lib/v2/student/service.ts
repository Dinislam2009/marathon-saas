import {
  STUDENT_STATUSES,
  type CreateStudentInput,
  type StudentRepository,
  type StudentStatus,
  type UpdateStudentInput,
} from "./types.ts";

function normalizeName(value: string, field: string) {
  const name = value.trim();
  if (name.length < 2) throw new Error(`${field} must contain at least 2 characters.`);
  return name;
}

function normalizeOptional(value: string | null | undefined) {
  if (value === undefined || value === null) return value ?? null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function assertStatus(status: StudentStatus) {
  if (!STUDENT_STATUSES.includes(status)) throw new Error(`Unsupported student status: ${status}`);
}

export class StudentService {
  private readonly repository: StudentRepository;

  constructor(repository: StudentRepository) {
    this.repository = repository;
  }

  async createStudent(input: CreateStudentInput) {
    const firstName = normalizeName(input.firstName, "Student first name");
    const lastName = normalizeName(input.lastName, "Student last name");
    const status = input.status ?? "ACTIVE";
    assertStatus(status);

    return this.repository.create({
      ...input,
      firstName,
      lastName,
      status,
      phone: normalizeOptional(input.phone),
      email: normalizeOptional(input.email),
      source: normalizeOptional(input.source),
      notes: normalizeOptional(input.notes),
    });
  }

  async getStudent(organizationId: string, studentId: string) {
    const student = await this.repository.findById(organizationId, studentId);
    if (!student) throw new Error("Student not found.");
    return student;
  }

  async listStudents(organizationId: string) {
    return this.repository.list(organizationId);
  }

  async updateStudent(organizationId: string, studentId: string, input: UpdateStudentInput) {
    const existing = await this.repository.findById(organizationId, studentId);
    if (!existing) throw new Error("Student not found.");

    const updateInput: UpdateStudentInput = { ...input };
    if (updateInput.firstName !== undefined) updateInput.firstName = normalizeName(updateInput.firstName, "Student first name");
    if (updateInput.lastName !== undefined) updateInput.lastName = normalizeName(updateInput.lastName, "Student last name");
    if (updateInput.status !== undefined) assertStatus(updateInput.status);
    if (updateInput.phone !== undefined) updateInput.phone = normalizeOptional(updateInput.phone);
    if (updateInput.email !== undefined) updateInput.email = normalizeOptional(updateInput.email);
    if (updateInput.source !== undefined) updateInput.source = normalizeOptional(updateInput.source);
    if (updateInput.notes !== undefined) updateInput.notes = normalizeOptional(updateInput.notes);

    return this.repository.update(organizationId, studentId, updateInput);
  }
}
