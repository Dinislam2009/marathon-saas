import { Attendance as PrismaAttendance, AttendanceStatus } from "../../../generated/prisma-v2";

export type AttendanceRecord = PrismaAttendance;

export interface MarkAttendanceInput {
  organizationId: string;
  studentId: string;
  lessonId: string;
  groupId?: string;
  status: AttendanceStatus;
  note?: string;
}

export interface UpdateAttendanceInput {
  status?: AttendanceStatus;
  note?: string;
}