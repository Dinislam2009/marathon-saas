import type { CourseRepository, CreateCourseInput, UpdateCourseInput } from "./types.ts";

function normalizeName(name: string) {
  const value = name.trim();
  if (value.length < 2) throw new Error("Course name must contain at least 2 characters.");
  return value;
}

function normalizeDescription(description: string | null | undefined) {
  if (description === undefined || description === null) return null;
  const value = description.trim();
  return value.length > 0 ? value : null;
}

export class CourseService {
  private readonly repository: CourseRepository;

  constructor(repository: CourseRepository) {
    this.repository = repository;
  }

  async createCourse(input: CreateCourseInput) {
    return this.repository.create({
      ...input,
      name: normalizeName(input.name),
      description: normalizeDescription(input.description),
    });
  }

  async getCourse(organizationId: string, courseId: string) {
    const course = await this.repository.findById(organizationId, courseId);
    if (!course) throw new Error("Course not found.");
    return course;
  }

  async listCourses(organizationId: string, programId?: string) {
    return this.repository.list(organizationId, programId);
  }

  async updateCourse(organizationId: string, courseId: string, input: UpdateCourseInput) {
    const existing = await this.repository.findById(organizationId, courseId);
    if (!existing) throw new Error("Course not found.");
    return this.repository.update(organizationId, courseId, {
      ...input,
      ...(input.name !== undefined ? { name: normalizeName(input.name) } : {}),
      ...(input.description !== undefined ? { description: normalizeDescription(input.description) } : {}),
    });
  }
}
