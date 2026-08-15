import type { PrismaClient } from "../../../generated/prisma-v2";
import type { CourseRepository, CreateCourseInput, CourseRecord, UpdateCourseInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaCourseRepository implements CourseRepository {
  private readonly prisma: PrismaV2Client;

  constructor(prisma: PrismaV2Client) {
    this.prisma = prisma;
  }

  async create(input: CreateCourseInput): Promise<CourseRecord> {
    return this.prisma.course.create({
      data: {
        organizationId: input.organizationId,
        programId: input.programId,
        name: input.name,
        description: input.description ?? null,
      },
    });
  }

  async findById(organizationId: string, courseId: string): Promise<CourseRecord | null> {
    return this.prisma.course.findFirst({ where: { id: courseId, organizationId } });
  }

  async list(organizationId: string, programId?: string): Promise<CourseRecord[]> {
    return this.prisma.course.findMany({
      where: { organizationId, ...(programId ? { programId } : {}) },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(organizationId: string, courseId: string, input: UpdateCourseInput): Promise<CourseRecord> {
    const existing = await this.findById(organizationId, courseId);
    if (!existing) throw new Error("Course not found.");
    return this.prisma.course.update({ where: { id: courseId }, data: input });
  }
}
