import type {
  AttendanceRecord,
  AttendanceRepository,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./types.ts";

export class InMemoryAttendanceRepository implements AttendanceRepository {
  private readonly records = new Map<string, AttendanceRecord>();

  async create(input: CreateAttendanceInput): Promise<AttendanceRecord> {
    const id = `attendance-${this.records.size + 1}`;
    const record: AttendanceRecord = {
      id,
      lessonId: input.lessonId,
      studentId: input.studentId,
      status: input.status,
      note: input.note ?? null,
      createdAt: new Date(),
    };
    this.records.set(this.key(input.lessonId, input.studentId), record);
    return record;
  }

  async findById(lessonId: string, studentId: string): Promise<AttendanceRecord | null> {
    return this.records.get(this.key(lessonId, studentId)) ?? null;
  }

  async listByLesson(lessonId: string): Promise<AttendanceRecord[]> {
    return [...this.records.values()].filter((record) => record.lessonId === lessonId);
  }

  async update(
    lessonId: string,
    studentId: string,
    input: UpdateAttendanceInput,
  ): Promise<AttendanceRecord> {
    const key = this.key(lessonId, studentId);
    const existing = this.records.get(key);
    if (!existing) throw new Error("Attendance not found.");

    const updated: AttendanceRecord = { ...existing, ...input };
    this.records.set(key, updated);
    return updated;
  }

  private key(lessonId: string, studentId: string): string {
    return `${lessonId}:${studentId}`;
  }
}
