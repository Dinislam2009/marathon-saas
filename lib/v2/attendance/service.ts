import type {
  AttendanceRecord,
  AttendanceRepository,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./types.ts";

export class AttendanceService {
  private readonly repository: AttendanceRepository;

  constructor(repository: AttendanceRepository) {
    this.repository = repository;
  }

  create(input: CreateAttendanceInput): Promise<AttendanceRecord> {
    if (!input.lessonId || !input.studentId) throw new Error("Lesson and student are required.");
    return this.repository.create(input);
  }

  get(lessonId: string, studentId: string): Promise<AttendanceRecord | null> {
    return this.repository.findById(lessonId, studentId);
  }

  listByLesson(lessonId: string): Promise<AttendanceRecord[]> {
    return this.repository.listByLesson(lessonId);
  }

  update(
    lessonId: string,
    studentId: string,
    input: UpdateAttendanceInput,
  ): Promise<AttendanceRecord> {
    if (!input.status && input.note === undefined) {
      throw new Error("Attendance update requires status or note.");
    }
    return this.repository.update(lessonId, studentId, input);
  }
}
