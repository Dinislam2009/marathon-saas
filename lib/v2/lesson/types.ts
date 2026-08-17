import { Lesson as PrismaLesson } from "../../../generated/prisma-v2";

export type LessonRecord = PrismaLesson;

export interface CreateLessonInput {
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  courseId: string;
  groupId: string; // Schema V2-де міндетті өріс
}

export interface UpdateLessonInput {
  title?: string;
  description?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  groupId?: string;
}