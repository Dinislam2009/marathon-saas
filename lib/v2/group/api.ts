import type { CreateGroupInput, GroupRepository, UpdateGroupInput } from "./types.ts";

export class GroupApiService {
  constructor(private readonly repository: GroupRepository) {}

  async createGroup(input: CreateGroupInput) {
    return this.repository.create(input);
  }

  async getGroup(organizationId: string, groupId: string) {
    return this.repository.findById(organizationId, groupId);
  }

  async listGroups(organizationId: string, courseId?: string) {
    return this.repository.list(organizationId, courseId);
  }

  async updateGroup(organizationId: string, groupId: string, input: UpdateGroupInput) {
    return this.repository.update(organizationId, groupId, input);
  }
}
