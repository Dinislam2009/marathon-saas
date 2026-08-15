export const GROUP_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

export type GroupRecord = {
  id: string;
  organizationId: string;
  courseId: string;
  teacherId: string | null;
  name: string;
  capacity: number | null;
  status: GroupStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGroupInput = {
  organizationId: string;
  courseId: string;
  teacherId?: string | null;
  name: string;
  capacity?: number | null;
  status?: GroupStatus;
};

export type UpdateGroupInput = {
  teacherId?: string | null;
  name?: string;
  capacity?: number | null;
  status?: GroupStatus;
};

export interface GroupRepository {
  create(input: CreateGroupInput): Promise<GroupRecord>;
  findById(organizationId: string, groupId: string): Promise<GroupRecord | null>;
  list(organizationId: string, courseId?: string): Promise<GroupRecord[]>;
  update(organizationId: string, groupId: string, input: UpdateGroupInput): Promise<GroupRecord>;
}
