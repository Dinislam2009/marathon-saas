import { StudentRepository } from "./repository";
import { StudentRecord, CreateStudentInput, UpdateStudentInput } from "./types";

export class StudentService {
  constructor(private readonly repository: StudentRepository) {}

  async createStudent(input: CreateStudentInput): Promise<StudentRecord> {
    return this.repository.create(input);
  }

  async getStudent(organizationId: string, id: string): Promise<StudentRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listStudents(organizationId: string, groupId?: string): Promise<StudentRecord[]> {
    return this.repository.findMany(organizationId, groupId);
  }

  async updateStudent(
    organizationId: string,
    id: string,
    input: UpdateStudentInput
  ): Promise<StudentRecord> {
    return this.repository.update(organizationId, id, input);
  }

  async deleteStudent(organizationId: string, id: string): Promise<void> {
    return this.repository.delete(organizationId, id);
  }
}