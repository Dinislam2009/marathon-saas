import type { SubmissionStatus } from "../../../generated/prisma-v2/index.js";

export type HomeworkSubmissionRecord = {
  id: string;
  homeworkId: string;
  studentId: string;
  content: string | null;
  fileUrl: string | null;
  status: SubmissionStatus;
  grade: number | null;
  feedback: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSubmissionInput = {
  homeworkId: string;
  studentId: string;
  content?: string | null;
  fileUrl?: string | null;
};

export type UpdateSubmissionInput = {
  content?: string | null;
  fileUrl?: string | null;
};

export type ReviewSubmissionInput = {
  grade?: number | null;
  feedback?: string | null;
};

export type SubmissionRepository = {
  findById(id: string): Promise<HomeworkSubmissionRecord | null>;
  findByHomeworkAndStudent(homeworkId: string, studentId: string): Promise<HomeworkSubmissionRecord | null>;
  create(input: CreateSubmissionInput): Promise<HomeworkSubmissionRecord>;
  update(id: string, input: UpdateSubmissionInput): Promise<HomeworkSubmissionRecord>;
  markSubmitted(id: string, submittedAt: Date): Promise<HomeworkSubmissionRecord>;
  review(id: string, input: ReviewSubmissionInput): Promise<HomeworkSubmissionRecord>;
};
