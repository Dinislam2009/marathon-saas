import { GroupRepository } from "./repository";
import { GroupRecord, CreateGroupInput, UpdateGroupInput } from "./types";

export class GroupService {
  constructor(private readonly repository: GroupRepository) {}

  async createGroup(input: CreateGroupInput): Promise<GroupRecord> {
    return this.repository.create(input);
  }

  async getGroup(organizationId: string, id: string): Promise<GroupRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listGroups(organizationId: string, courseId?: string): Promise<GroupRecord[]> {
    return this.repository.findMany(organizationId, courseId);
  }

  async updateGroup(
    organizationId: string,
    id: string,
    input: UpdateGroupInput
  ): Promise<GroupRecord> {
    return this.repository.update(organizationId, id, input);
  }

  async deleteGroup(organizationId: string, id: string): Promise<void> {
    return this.repository.delete(organizationId, id);
  }
}