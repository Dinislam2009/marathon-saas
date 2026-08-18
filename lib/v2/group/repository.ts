import { GroupRecord, CreateGroupInput, UpdateGroupInput } from "./types";

export interface GroupRepository {
  create(input: CreateGroupInput): Promise<GroupRecord>;
  findById(organizationId: string, id: string): Promise<GroupRecord | null>;
  findMany(organizationId: string, courseId?: string): Promise<GroupRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateGroupInput
  ): Promise<GroupRecord>;
  delete(organizationId: string, id: string): Promise<void>;
}