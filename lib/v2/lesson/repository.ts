import { LessonRecord, CreateLessonInput, UpdateLessonInput } from "./types";

export interface LessonRepository {
  create(input: CreateLessonInput): Promise<LessonRecord>;
  findById(organizationId: string, id: string): Promise<LessonRecord | null>;
  findMany(
    organizationId: string,
    courseId?: string,
    groupId?: string
  ): Promise<LessonRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateLessonInput
  ): Promise<LessonRecord>;
  delete(organizationId: string, id: string): Promise<void>;
}