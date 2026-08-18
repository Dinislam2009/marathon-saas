import { Homework as PrismaHomework } from "../../../generated/prisma-v2";

export type HomeworkRecord = PrismaHomework;

export interface CreateHomeworkInput {
  title: string;
  description?: string | null;
  lessonId: string;
}

export interface UpdateHomeworkInput {
  title?: string;
  description?: string | null;
}