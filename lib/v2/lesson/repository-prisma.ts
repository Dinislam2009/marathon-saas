import { PrismaClient } from "../../../generated/prisma-v2";
import { LessonRepository } from "./repository";
import { LessonRecord, CreateLessonInput, UpdateLessonInput } from "./types";

export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateLessonInput): Promise<LessonRecord> {
    return this.prisma.lesson.create({
      data: {
        title: input.title,
        description: input.description,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        course: { connect: { id: input.courseId } },
        group: { connect: { id: input.groupId } },
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<LessonRecord | null> {
    return this.prisma.lesson.findFirst({
      where: {
        id,
        course: { organizationId },
      },
    });
  }

  async findMany(
    organizationId: string,
    courseId?: string,
    groupId?: string
  ): Promise<LessonRecord[]> {
    return this.prisma.lesson.findMany({
      where: {
        course: { organizationId },
        ...(courseId ? { courseId } : {}),
        ...(groupId ? { groupId } : {}),
      },
      orderBy: { startsAt: "asc" },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateLessonInput
  ): Promise<LessonRecord> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Lesson record not found");
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.startsAt ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt ? { endsAt: input.endsAt } : {}),
        ...(input.groupId ? { group: { connect: { id: input.groupId } } } : {}),
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Lesson record not found");
    }

    await this.prisma.lesson.delete({
      where: { id },
    });
  }
}