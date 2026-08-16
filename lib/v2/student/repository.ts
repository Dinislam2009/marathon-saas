import type { CreateStudentInput, StudentRecord, StudentRepository, UpdateStudentInput } from "./types.ts";

export class InMemoryStudentRepository implements StudentRepository {
  private readonly students = new Map<string, StudentRecord>();

  async create(input: CreateStudentInput): Promise<StudentRecord> {
    const now = new Date();
    const student: StudentRecord = {
      id: `student-${this.students.size + 1}`,
      organizationId: input.organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
      email: input.email ?? null,
      dateOfBirth: input.dateOfBirth ?? null,
      status: input.status ?? "ACTIVE",
      source: input.source ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.students.set(student.id, student);
    return student;
  }

  async findById(organizationId: string, studentId: string): Promise<StudentRecord | null> {
    const student = this.students.get(studentId);
    return student?.organizationId === organizationId ? student : null;
  }

  async list(organizationId: string): Promise<StudentRecord[]> {
    return [...this.students.values()].filter((student) => student.organizationId === organizationId);
  }

  async update(organizationId: string, studentId: string, input: UpdateStudentInput): Promise<StudentRecord> {
    const existing = await this.findById(organizationId, studentId);
    if (!existing) throw new Error("Student not found.");
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.students.set(studentId, updated);
    return updated;
  }
}
