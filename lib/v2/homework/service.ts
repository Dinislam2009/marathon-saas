import type { CreateHomeworkInput, HomeworkRecord, HomeworkRepository, UpdateHomeworkInput } from "./types.ts";

export class HomeworkService {
  private readonly repository: HomeworkRepository;

  constructor(repository: HomeworkRepository) {
    this.repository = repository;
  }

  create(input: CreateHomeworkInput): Promise<HomeworkRecord> {
    if (!input.lessonId) throw new Error("Lesson is required.");
    if (!input.title.trim()) throw new Error("Homework title is required.");
    return this.repository.create(input);
  }

  get(lessonId: string, homeworkId: string): Promise<HomeworkRecord | null> {
    return this.repository.findById(lessonId, homeworkId);
  }

  list(lessonId: string): Promise<HomeworkRecord[]> {
    return this.repository.listByLesson(lessonId);
  }

  update(
    lessonId: string,
    homeworkId: string,
    input: UpdateHomeworkInput,
  ): Promise<HomeworkRecord> {
    if (input.title !== undefined && !input.title.trim()) {
      throw new Error("Homework title is required.");
    }
    return this.repository.update(lessonId, homeworkId, input);
  }
}
