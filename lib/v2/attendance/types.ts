export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
  id: string;
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
  note: string | null;
  createdAt: Date;
}

export interface CreateAttendanceInput {
  lessonId: string;
  studentId: string;
  status: AttendanceStatus;
  note?: string | null;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceRepository {
  create(input: CreateAttendanceInput): Promise<AttendanceRecord>;
  findById(lessonId: string, studentId: string): Promise<AttendanceRecord | null>;
  listByLesson(lessonId: string): Promise<AttendanceRecord[]>;
  update(lessonId: string, studentId: string, input: UpdateAttendanceInput): Promise<AttendanceRecord>;
}

export const ATTENDANCE_CORE_VERSION = "v2";
