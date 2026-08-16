import type { PrismaClient } from "../../../generated/prisma-v2";
import type { CreateHomeworkInput, HomeworkRecord, HomeworkRepository, UpdateHomeworkInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaHomeworkRepository implements HomeworkRepository {
  private readonly prisma: PrismaV2Client;

  constructor(prisma: PrismaV2Client) {
    this.prisma = prisma;
  }

  async create(input: CreateHomeworkInput): Promise<HomeworkRecord> {
    return this.prisma.homework.create({
      data: {
        lessonId: input.lessonId,
        title: input.title,
        description: input.description ?? null,
        deadline: input.deadline ?? null,
        status: input.status ?? "DRAFT",
      },
    });
  }

  async findById(lessonId: string, homeworkId: string): Promise<HomeworkRecord | null> {
    return this.prisma.homework.findFirst({ where: { id: homeworkId, lessonId } });
  }

  async listByLesson(lessonId: string): Promise<HomeworkRecord[]> {
    return this.prisma.homework.findMany({
      where: { lessonId },
      orderBy: { deadline: "asc" },
    });
  }

  async update(
    lessonId: string,
    homeworkId: string,
    input: UpdateHomeworkInput,
  ): Promise<HomeworkRecord> {
    const existing = await this.findById(lessonId, homeworkId);
    if (!existing) throw new Error("Homework not found.");
    return this.prisma.homework.update({ where: { id: homeworkId }, data: input });
  }
}
