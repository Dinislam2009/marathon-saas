import type { CourseRecord, CreateCourseInput, CourseRepository, UpdateCourseInput } from "./types.ts";

export class InMemoryCourseRepository implements CourseRepository {
  private readonly courses = new Map<string, CourseRecord>();

  async create(input: CreateCourseInput): Promise<CourseRecord> {
    const now = new Date();
    const course: CourseRecord = {
      id: `course_${this.courses.size + 1}`,
      organizationId: input.organizationId,
      programId: input.programId,
      name: input.name,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.courses.set(course.id, course);
    return course;
  }

  async findById(organizationId: string, courseId: string) {
    const course = this.courses.get(courseId);
    return course?.organizationId === organizationId ? course : null;
  }

  async list(organizationId: string, programId?: string) {
    return [...this.courses.values()].filter(
      (course) => course.organizationId === organizationId && (!programId || course.programId === programId),
    );
  }

  async update(organizationId: string, courseId: string, input: UpdateCourseInput) {
    const existing = await this.findById(organizationId, courseId);
    if (!existing) throw new Error("Course not found.");
    const updated: CourseRecord = { ...existing, ...input, updatedAt: new Date() };
    this.courses.set(courseId, updated);
    return updated;
  }
}
