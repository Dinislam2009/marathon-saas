import { HomeworkRepository } from "./repository";
import { HomeworkRecord, CreateHomeworkInput, UpdateHomeworkInput } from "./types";

export class HomeworkService {
  constructor(private readonly repository: HomeworkRepository) {}

  async createHomework(input: CreateHomeworkInput): Promise<HomeworkRecord> {
    return this.repository.create(input);
  }

  async getHomework(organizationId: string, id: string): Promise<HomeworkRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listHomeworks(organizationId: string, lessonId?: string): Promise<HomeworkRecord[]> {
    return this.repository.findMany(organizationId, lessonId);
  }

  async updateHomework(
    organizationId: string,
    id: string,
    input: UpdateHomeworkInput
  ): Promise<HomeworkRecord> {
    return this.repository.update(organizationId, id, input);
  }

  async deleteHomework(organizationId: string, id: string): Promise<void> {
    return this.repository.delete(organizationId, id);
  }
}