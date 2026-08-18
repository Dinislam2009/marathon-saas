import { CourseRepository } from "./repository";
import { CourseRecord, CreateCourseInput, UpdateCourseInput } from "./types";

export class CourseService {
  constructor(private readonly repository: CourseRepository) {}

  async createCourse(input: CreateCourseInput): Promise<CourseRecord> {
    return this.repository.create(input);
  }

  async getCourse(organizationId: string, id: string): Promise<CourseRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listCourses(organizationId: string): Promise<CourseRecord[]> {
    return this.repository.findMany(organizationId);
  }

  async updateCourse(
    organizationId: string,
    id: string,
    input: UpdateCourseInput
  ): Promise<CourseRecord> {
    return this.repository.update(organizationId, id, input);
  }

  async deleteCourse(organizationId: string, id: string): Promise<void> {
    return this.repository.delete(organizationId, id);
  }
}