export type HomeworkStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export interface HomeworkRecord {
  id: string;
  lessonId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  status: HomeworkStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHomeworkInput {
  lessonId: string;
  title: string;
  description?: string | null;
  deadline?: Date | null;
  status?: HomeworkStatus;
}

export interface UpdateHomeworkInput {
  title?: string;
  description?: string | null;
  deadline?: Date | null;
  status?: HomeworkStatus;
}

export interface HomeworkRepository {
  create(input: CreateHomeworkInput): Promise<HomeworkRecord>;
  findById(lessonId: string, homeworkId: string): Promise<HomeworkRecord | null>;
  listByLesson(lessonId: string): Promise<HomeworkRecord[]>;
  update(lessonId: string, homeworkId: string, input: UpdateHomeworkInput): Promise<HomeworkRecord>;
}

export const HOMEWORK_CORE_VERSION = "v2";
