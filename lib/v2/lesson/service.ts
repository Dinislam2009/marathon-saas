import type {
  CreateLessonInput,
  LessonRecord,
  LessonRepository,
  UpdateLessonInput,
} from "./types.ts";

export class LessonService {
  private readonly repository: LessonRepository;

  constructor(repository: LessonRepository) {
    this.repository = repository;
  }

  create(input: CreateLessonInput): Promise<LessonRecord> {
    if (!input.courseId || !input.groupId) throw new Error("Course and group are required.");
    if (!input.title.trim()) throw new Error("Lesson title is required.");
    if (input.endsAt <= input.startsAt) throw new Error("Lesson end must be after start.");
    return this.repository.create(input);
  }

  get(courseId: string, groupId: string, lessonId: string): Promise<LessonRecord | null> {
    return this.repository.findById(courseId, groupId, lessonId);
  }

  list(courseId: string, groupId: string): Promise<LessonRecord[]> {
    return this.repository.list(courseId, groupId);
  }

  update(
    courseId: string,
    groupId: string,
    lessonId: string,
    input: UpdateLessonInput,
  ): Promise<LessonRecord> {
    if (input.title !== undefined && !input.title.trim()) {
      throw new Error("Lesson title is required.");
    }
    if (input.startsAt && input.endsAt && input.endsAt <= input.startsAt) {
      throw new Error("Lesson end must be after start.");
    }
    return this.repository.update(courseId, groupId, lessonId, input);
  }
}
