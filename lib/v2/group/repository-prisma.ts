import type { PrismaClient } from "../../../generated/prisma-v2";
import type { CreateGroupInput, GroupRecord, GroupRepository, UpdateGroupInput } from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaGroupRepository implements GroupRepository {
  private readonly prisma: PrismaV2Client;

  constructor(prisma: PrismaV2Client) {
    this.prisma = prisma;
  }

  async create(input: CreateGroupInput): Promise<GroupRecord> {
    return this.prisma.group.create({
      data: {
        organizationId: input.organizationId,
        courseId: input.courseId,
        teacherId: input.teacherId ?? null,
        name: input.name,
        capacity: input.capacity ?? null,
        status: input.status ?? "ACTIVE",
      },
    });
  }

  async findById(organizationId: string, groupId: string): Promise<GroupRecord | null> {
    return this.prisma.group.findFirst({ where: { id: groupId, organizationId } });
  }

  async list(organizationId: string, courseId?: string): Promise<GroupRecord[]> {
    return this.prisma.group.findMany({
      where: { organizationId, ...(courseId ? { courseId } : {}) },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(organizationId: string, groupId: string, input: UpdateGroupInput): Promise<GroupRecord> {
    const existing = await this.findById(organizationId, groupId);
    if (!existing) throw new Error("Group not found.");
    return this.prisma.group.update({ where: { id: groupId }, data: input });
  }
}
