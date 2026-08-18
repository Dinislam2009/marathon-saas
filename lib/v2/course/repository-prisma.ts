import { PrismaClient } from "../../../generated/prisma-v2";
import { CourseRepository } from "./repository";
import { CourseRecord, CreateCourseInput, UpdateCourseInput } from "./types";

export class PrismaCourseRepository implements CourseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateCourseInput): Promise<CourseRecord> {
    return this.prisma.course.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        organization: {
          connect: { id: input.organizationId },
        },
        ...(input.programId
          ? { program: { connect: { id: input.programId } } }
          : {}),
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<CourseRecord | null> {
    return this.prisma.course.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async findMany(organizationId: string): Promise<CourseRecord[]> {
    return this.prisma.course.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateCourseInput
  ): Promise<CourseRecord> {
    return this.prisma.course.update({
      where: {
        id,
        organizationId,
      },
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        ...(input.programId
          ? { program: { connect: { id: input.programId } } }
          : {}),
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.course.delete({
      where: {
        id,
        organizationId,
      },
    });
  }
}