import type {
  CreateSubmissionInput,
  HomeworkSubmissionRecord,
  ReviewSubmissionInput,
  SubmissionRepository,
  UpdateSubmissionInput,
} from "./types.ts";

export class InMemorySubmissionRepository implements SubmissionRepository {
  private readonly records = new Map<string, HomeworkSubmissionRecord>();

  async findById(id: string): Promise<HomeworkSubmissionRecord | null> {
    return this.records.get(id) ?? null;
  }

  async findByHomeworkAndStudent(homeworkId: string, studentId: string): Promise<HomeworkSubmissionRecord | null> {
    return [...this.records.values()].find((record) => record.homeworkId === homeworkId && record.studentId === studentId) ?? null;
  }

  async create(input: CreateSubmissionInput): Promise<HomeworkSubmissionRecord> {
    const existing = await this.findByHomeworkAndStudent(input.homeworkId, input.studentId);
    if (existing) throw new Error("Submission already exists.");

    const now = new Date();
    const record: HomeworkSubmissionRecord = {
      id: crypto.randomUUID(),
      homeworkId: input.homeworkId,
      studentId: input.studentId,
      content: input.content ?? null,
      fileUrl: input.fileUrl ?? null,
      status: "PENDING",
      grade: null,
      feedback: null,
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.records.set(record.id, record);
    return record;
  }

  async update(id: string, input: UpdateSubmissionInput): Promise<HomeworkSubmissionRecord> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Submission not found.");
    const updated = { ...existing, ...input, updatedAt: new Date() };
    this.records.set(id, updated);
    return updated;
  }

  async markSubmitted(id: string, submittedAt: Date): Promise<HomeworkSubmissionRecord> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Submission not found.");
    const updated = { ...existing, status: "SUBMITTED" as const, submittedAt, updatedAt: new Date() };
    this.records.set(id, updated);
    return updated;
  }

  async review(id: string, input: ReviewSubmissionInput): Promise<HomeworkSubmissionRecord> {
    const existing = await this.findById(id);
    if (!existing) throw new Error("Submission not found.");
    const updated = { ...existing, ...input, status: "REVIEWED" as const, updatedAt: new Date() };
    this.records.set(id, updated);
    return updated;
  }
}
