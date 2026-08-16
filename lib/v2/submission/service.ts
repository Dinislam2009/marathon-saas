import type {
  CreateSubmissionInput,
  HomeworkSubmissionRecord,
  ReviewSubmissionInput,
  SubmissionRepository,
  UpdateSubmissionInput,
} from "./types.ts";

export class SubmissionService {
  constructor(private readonly repository: SubmissionRepository) {}

  getById(id: string): Promise<HomeworkSubmissionRecord | null> {
    return this.repository.findById(id);
  }

  getByHomeworkAndStudent(homeworkId: string, studentId: string): Promise<HomeworkSubmissionRecord | null> {
    return this.repository.findByHomeworkAndStudent(homeworkId, studentId);
  }

  create(input: CreateSubmissionInput): Promise<HomeworkSubmissionRecord> {
    if (!input.homeworkId || !input.studentId) {
      throw new Error("homeworkId and studentId are required.");
    }
    if (!input.content?.trim() && !input.fileUrl?.trim()) {
      throw new Error("Submission must contain content or a file.");
    }
    return this.repository.create(input);
  }

  update(id: string, input: UpdateSubmissionInput): Promise<HomeworkSubmissionRecord> {
    if (!input.content?.trim() && !input.fileUrl?.trim()) {
      throw new Error("Submission must contain content or a file.");
    }
    return this.repository.update(id, input);
  }

  submit(id: string): Promise<HomeworkSubmissionRecord> {
    return this.repository.markSubmitted(id, new Date());
  }

  review(id: string, input: ReviewSubmissionInput): Promise<HomeworkSubmissionRecord> {
    if (input.grade != null && (input.grade < 0 || input.grade > 100)) {
      throw new Error("Grade must be between 0 and 100.");
    }
    return this.repository.review(id, input);
  }
}
