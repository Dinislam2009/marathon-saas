import type { PrismaClient } from "../../../generated/prisma-v2/index.js";
import type {
  CreateSubmissionInput,
  HomeworkSubmissionRecord,
  ReviewSubmissionInput,
  SubmissionRepository,
  UpdateSubmissionInput,
} from "./types.ts";

export class PrismaSubmissionRepository implements SubmissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<HomeworkSubmissionRecord | null> {
    return this.prisma.homeworkSubmission.findUnique({ where: { id } });
  }

  async findByHomeworkAndStudent(homeworkId: string, studentId: string): Promise<HomeworkSubmissionRecord | null> {
    return this.prisma.homeworkSubmission.findUnique({
      where: { homeworkId_studentId: { homeworkId, studentId } },
    });
  }

  async create(input: CreateSubmissionInput): Promise<HomeworkSubmissionRecord> {
    return this.prisma.homeworkSubmission.create({
      data: {
        homeworkId: input.homeworkId,
        studentId: input.studentId,
        content: input.content ?? null,
        fileUrl: input.fileUrl ?? null,
      },
    });
  }

  async update(id: string, input: UpdateSubmissionInput): Promise<HomeworkSubmissionRecord> {
    return this.prisma.homeworkSubmission.update({
      where: { id },
      data: {
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
      },
    });
  }

  async markSubmitted(id: string, submittedAt: Date): Promise<HomeworkSubmissionRecord> {
    return this.prisma.homeworkSubmission.update({
      where: { id },
      data: { status: "SUBMITTED", submittedAt },
    });
  }

  async review(id: string, input: ReviewSubmissionInput): Promise<HomeworkSubmissionRecord> {
    return this.prisma.homeworkSubmission.update({
      where: { id },
      data: {
        status: "REVIEWED",
        ...(input.grade !== undefined ? { grade: input.grade } : {}),
        ...(input.feedback !== undefined ? { feedback: input.feedback } : {}),
      },
    });
  }
}
