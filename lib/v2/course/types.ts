import { Course as PrismaCourse } from "../../../generated/prisma-v2";

export type CourseRecord = PrismaCourse;

export interface CreateCourseInput {
  organizationId: string;
  name: string;
  programId?: string;
  code?: string;
  description?: string;
}

export interface UpdateCourseInput {
  name?: string;
  programId?: string;
  code?: string;
  description?: string;
}