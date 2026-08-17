import { AttendanceRecord, MarkAttendanceInput, UpdateAttendanceInput } from "./types";

export interface AttendanceRepository {
  mark(input: MarkAttendanceInput): Promise<AttendanceRecord>;
  findById(organizationId: string, id: string): Promise<AttendanceRecord | null>;
  findMany(
    organizationId: string,
    groupId?: string,
    studentId?: string
  ): Promise<AttendanceRecord[]>;
  update(
    organizationId: string,
    id: string,
    input: UpdateAttendanceInput
  ): Promise<AttendanceRecord>;
}