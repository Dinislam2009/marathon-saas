import type { CreateHomeworkInput, HomeworkRecord, HomeworkRepository, UpdateHomeworkInput } from "./types.ts";

export class InMemoryHomeworkRepository implements HomeworkRepository {
  private readonly homeworks = new Map<string, HomeworkRecord>();

  async create(input: CreateHomeworkInput): Promise<HomeworkRecord> {
    const now = new Date();
    const homework: HomeworkRecord = {
      id: `homework-${this.homeworks.size + 1}`,
      lessonId: input.lessonId,
      title: input.title,
      description: input.description ?? null,
      deadline: input.deadline ?? null,
      status: input.status ?? "DRAFT",
      createdAt: now,
      updatedAt: now,
    };
    this.homeworks.set(homework.id, homework);
    return homework;
  }

  async findById(lessonId: string, homeworkId: string): Promise<HomeworkRecord | null> {
    const homework = this.homeworks.get(homeworkId);
    return homework?.lessonId === lessonId ? homework : null;
  }

  async listByLesson(lessonId: string): Promise<HomeworkRecord[]> {
    return [...this.homeworks.values()]
      .filter((homework) => homework.lessonId === lessonId)
      .sort((a, b) => (a.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.deadline?.getTime() ?? Number.MAX_SAFE_INTEGER));
  }

  async update(
    lessonId: string,
    homeworkId: string,
    input: UpdateHomeworkInput,
  ): Promise<HomeworkRecord> {
    const existing = await this.findById(lessonId, homeworkId);
    if (!existing) throw new Error("Homework not found.");
    const updated: HomeworkRecord = { ...existing, ...input, updatedAt: new Date() };
    this.homeworks.set(homeworkId, updated);
    return updated;
  }
}
