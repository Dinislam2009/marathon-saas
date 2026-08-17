import { PrismaClient } from "../../../generated/prisma-v2";
import { HomeworkRepository } from "./repository";
import { HomeworkRecord, CreateHomeworkInput, UpdateHomeworkInput } from "./types";

export class PrismaHomeworkRepository implements HomeworkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateHomeworkInput): Promise<HomeworkRecord> {
    return this.prisma.homework.create({
      data: {
        title: input.title,
        description: input.description,
        lesson: { connect: { id: input.lessonId } },
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<HomeworkRecord | null> {
    return this.prisma.homework.findFirst({
      where: {
        id,
        lesson: { course: { organizationId } },
      },
    });
  }

  async findMany(organizationId: string, lessonId?: string): Promise<HomeworkRecord[]> {
    return this.prisma.homework.findMany({
      where: {
        lesson: { course: { organizationId } },
        ...(lessonId ? { lessonId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateHomeworkInput
  ): Promise<HomeworkRecord> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Homework record not found");
    }

    return this.prisma.homework.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Homework record not found");
    }

    await this.prisma.homework.delete({
      where: { id },
    });
  }
}