import { StudentRecord, CreateStudentInput, UpdateStudentInput } from "./types";

export interface StudentRepository {
  create(input: CreateStudentInput): Promise<StudentRecord>;
  findById(organizationId: string, id: string): Promise<StudentRecord | null>;
  findMany(organizationId: string, groupId?: string): Promise<StudentRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateStudentInput
  ): Promise<StudentRecord>;
  delete(organizationId: string, id: string): Promise<void>;
}