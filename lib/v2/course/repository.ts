import { CourseRecord, CreateCourseInput, UpdateCourseInput } from "./types";

export interface CourseRepository {
  create(input: CreateCourseInput): Promise<CourseRecord>;
  findById(organizationId: string, id: string): Promise<CourseRecord | null>;
  findMany(organizationId: string): Promise<CourseRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateCourseInput
  ): Promise<CourseRecord>;
  delete(organizationId: string, id: string): Promise<void>;
}