import { GROUP_STATUSES, type CreateGroupInput, type GroupRepository, type GroupStatus, type UpdateGroupInput } from "./types.ts";

function normalizeName(name: string) {
  const value = name.trim();
  if (value.length < 2) throw new Error("Group name must contain at least 2 characters.");
  return value;
}

function assertStatus(status: GroupStatus) {
  if (!GROUP_STATUSES.includes(status)) throw new Error(`Unsupported group status: ${status}`);
}

function assertCapacity(capacity: number | null | undefined) {
  if (capacity !== undefined && capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) {
    throw new Error("Group capacity must be a positive integer.");
  }
}

export class GroupService {
  private readonly repository: GroupRepository;

  constructor(repository: GroupRepository) {
    this.repository = repository;
  }

  async createGroup(input: CreateGroupInput) {
    const name = normalizeName(input.name);
    const status = input.status ?? "ACTIVE";
    assertStatus(status);
    assertCapacity(input.capacity);
    return this.repository.create({ ...input, name, status });
  }

  async getGroup(organizationId: string, groupId: string) {
    const group = await this.repository.findById(organizationId, groupId);
    if (!group) throw new Error("Group not found.");
    return group;
  }

  async listGroups(organizationId: string, courseId?: string) {
    return this.repository.list(organizationId, courseId);
  }

  async updateGroup(organizationId: string, groupId: string, input: UpdateGroupInput) {
    const existing = await this.repository.findById(organizationId, groupId);
    if (!existing) throw new Error("Group not found.");
    if (input.name !== undefined) input.name = normalizeName(input.name);
    if (input.status !== undefined) assertStatus(input.status);
    assertCapacity(input.capacity);
    return this.repository.update(organizationId, groupId, input);
  }
}
