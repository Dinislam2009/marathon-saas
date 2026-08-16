import type { CreateLessonInput, LessonRecord, LessonRepository, UpdateLessonInput } from "./types.ts";

export class InMemoryLessonRepository implements LessonRepository {
  private readonly lessons = new Map<string, LessonRecord>();

  async create(input: CreateLessonInput): Promise<LessonRecord> {
    const now = new Date();
    const lesson: LessonRecord = {
      id: `lesson-${this.lessons.size + 1}`,
      courseId: input.courseId,
      groupId: input.groupId,
      title: input.title,
      description: input.description ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdAt: now,
      updatedAt: now,
    };
    this.lessons.set(lesson.id, lesson);
    return lesson;
  }

  async findById(courseId: string, groupId: string, lessonId: string): Promise<LessonRecord | null> {
    const lesson = this.lessons.get(lessonId);
    return lesson?.courseId === courseId && lesson.groupId === groupId ? lesson : null;
  }

  async list(courseId: string, groupId: string): Promise<LessonRecord[]> {
    return [...this.lessons.values()]
      .filter((lesson) => lesson.courseId === courseId && lesson.groupId === groupId)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  async update(
    courseId: string,
    groupId: string,
    lessonId: string,
    input: UpdateLessonInput,
  ): Promise<LessonRecord> {
    const existing = await this.findById(courseId, groupId, lessonId);
    if (!existing) throw new Error("Lesson not found.");
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.lessons.set(lessonId, updated);
    return updated;
  }
}
