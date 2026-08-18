import { HomeworkRecord, CreateHomeworkInput, UpdateHomeworkInput } from "./types";

export interface HomeworkRepository {
  create(input: CreateHomeworkInput): Promise<HomeworkRecord>;
  findById(organizationId: string, id: string): Promise<HomeworkRecord | null>;
  findMany(organizationId: string, lessonId?: string): Promise<HomeworkRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateHomeworkInput
  ): Promise<HomeworkRecord>;
  delete(organizationId: string, id: string): Promise<void>;
}