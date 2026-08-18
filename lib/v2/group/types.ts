import { Group as PrismaGroup } from "../../../generated/prisma-v2";

export type GroupRecord = PrismaGroup;

export interface CreateGroupInput {
  organizationId: string;
  courseId: string;
  name: string;
  capacity?: number;
}

export interface UpdateGroupInput {
  name?: string;
  capacity?: number;
}