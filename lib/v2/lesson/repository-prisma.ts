import type { PrismaClient } from "../../../generated/prisma-v2";
import type { CreateLessonInput, LessonRecord, LessonRepository, UpdateLessonInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prisma: PrismaV2Client) {}

  async create(input: CreateLessonInput): Promise<LessonRecord> {
    return this.prisma.lesson.create({
      data: {
        courseId: input.courseId,
        groupId: input.groupId,
        title: input.title,
        description: input.description ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
      },
    });
  }

  async findById(courseId: string, groupId: string, lessonId: string): Promise<LessonRecord | null> {
    return this.prisma.lesson.findFirst({ where: { id: lessonId, courseId, groupId } });
  }

  async list(courseId: string, groupId: string): Promise<LessonRecord[]> {
    return this.prisma.lesson.findMany({
      where: { courseId, groupId },
      orderBy: { startsAt: "asc" },
    });
  }

  async update(
    courseId: string,
    groupId: string,
    lessonId: string,
    input: UpdateLessonInput,
  ): Promise<LessonRecord> {
    const existing = await this.findById(courseId, groupId, lessonId);
    if (!existing) throw new Error("Lesson not found.");
    return this.prisma.lesson.update({ where: { id: lessonId }, data: input });
  }
}
