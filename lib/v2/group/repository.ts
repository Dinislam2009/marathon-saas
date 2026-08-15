import type { CreateGroupInput, GroupRecord, GroupRepository, UpdateGroupInput } from "./types.ts";

export class InMemoryGroupRepository implements GroupRepository {
  private readonly groups = new Map<string, GroupRecord>();

  async create(input: CreateGroupInput): Promise<GroupRecord> {
    const now = new Date();
    const record: GroupRecord = {
      id: `group-${this.groups.size + 1}`,
      organizationId: input.organizationId,
      courseId: input.courseId,
      teacherId: input.teacherId ?? null,
      name: input.name,
      capacity: input.capacity ?? null,
      status: input.status ?? "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };
    this.groups.set(record.id, record);
    return record;
  }

  async findById(organizationId: string, groupId: string): Promise<GroupRecord | null> {
    const group = this.groups.get(groupId);
    return group?.organizationId === organizationId ? group : null;
  }

  async list(organizationId: string, courseId?: string): Promise<GroupRecord[]> {
    return [...this.groups.values()].filter(
      (group) => group.organizationId === organizationId && (!courseId || group.courseId === courseId),
    );
  }

  async update(organizationId: string, groupId: string, input: UpdateGroupInput): Promise<GroupRecord> {
    const existing = await this.findById(organizationId, groupId);
    if (!existing) throw new Error("Group not found.");
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.groups.set(groupId, updated);
    return updated;
  }
}
