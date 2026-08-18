import { PrismaClient } from "../../../generated/prisma-v2";
import { GroupRepository } from "./repository";
import { GroupRecord, CreateGroupInput, UpdateGroupInput } from "./types";

export class PrismaGroupRepository implements GroupRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateGroupInput): Promise<GroupRecord> {
    return this.prisma.group.create({
      data: {
        name: input.name,
        capacity: input.capacity,
        organization: {
          connect: { id: input.organizationId },
        },
        course: {
          connect: { id: input.courseId },
        },
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<GroupRecord | null> {
    return this.prisma.group.findFirst({
      where: {
        id,
        organizationId,
      },
    });
  }

  async findMany(organizationId: string, courseId?: string): Promise<GroupRecord[]> {
    return this.prisma.group.findMany({
      where: {
        organizationId,
        ...(courseId ? { courseId } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateGroupInput
  ): Promise<GroupRecord> {
    return this.prisma.group.update({
      where: {
        id,
        organizationId,
      },
      data: {
        name: input.name,
        capacity: input.capacity,
      },
    });
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.group.delete({
      where: {
        id,
        organizationId,
      },
    });
  }
}