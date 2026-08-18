import { LessonRepository } from "./repository";
import { LessonRecord, CreateLessonInput, UpdateLessonInput } from "./types";

export class LessonService {
  constructor(private readonly repository: LessonRepository) {}

  async createLesson(input: CreateLessonInput): Promise<LessonRecord> {
    return this.repository.create(input);
  }

  async getLesson(organizationId: string, id: string): Promise<LessonRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listLessons(
    organizationId: string,
    courseId?: string,
    groupId?: string
  ): Promise<LessonRecord[]> {
    return this.repository.findMany(organizationId, courseId, groupId);
  }

  async updateLesson(
    organizationId: string,
    id: string,
    input: UpdateLessonInput
  ): Promise<LessonRecord> {
    return this.repository.update(organizationId, id, input);
  }

  async deleteLesson(organizationId: string, id: string): Promise<void> {
    return this.repository.delete(organizationId, id);
  }
}