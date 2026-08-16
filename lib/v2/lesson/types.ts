export interface LessonRecord {
  id: string;
  courseId: string;
  groupId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLessonInput {
  courseId: string;
  groupId: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
}

export interface UpdateLessonInput {
  title?: string;
  description?: string | null;
  startsAt?: Date;
  endsAt?: Date;
}

export interface LessonRepository {
  create(input: CreateLessonInput): Promise<LessonRecord>;
  findById(courseId: string, groupId: string, lessonId: string): Promise<LessonRecord | null>;
  list(courseId: string, groupId: string): Promise<LessonRecord[]>;
  update(courseId: string, groupId: string, lessonId: string, input: UpdateLessonInput): Promise<LessonRecord>;
}

export const LESSON_CORE_VERSION = "v2";
