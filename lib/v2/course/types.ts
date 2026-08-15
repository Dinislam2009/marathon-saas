export type CourseRecord = {
  id: string;
  organizationId: string;
  programId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCourseInput = {
  organizationId: string;
  programId: string;
  name: string;
  description?: string | null;
};

export type UpdateCourseInput = {
  name?: string;
  description?: string | null;
};

export interface CourseRepository {
  create(input: CreateCourseInput): Promise<CourseRecord>;
  findById(organizationId: string, courseId: string): Promise<CourseRecord | null>;
  list(organizationId: string, programId?: string): Promise<CourseRecord[]>;
  update(organizationId: string, courseId: string, input: UpdateCourseInput): Promise<CourseRecord>;
}
