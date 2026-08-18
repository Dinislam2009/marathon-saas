import { AttendanceRepository } from "./repository";
import { AttendanceRecord, MarkAttendanceInput, UpdateAttendanceInput } from "./types";

export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  async markAttendance(input: MarkAttendanceInput): Promise<AttendanceRecord> {
    return this.repository.mark(input);
  }

  async getAttendance(organizationId: string, id: string): Promise<AttendanceRecord | null> {
    return this.repository.findById(organizationId, id);
  }

  async listAttendance(
    organizationId: string,
    groupId?: string,
    studentId?: string
  ): Promise<AttendanceRecord[]> {
    return this.repository.findMany(organizationId, groupId, studentId);
  }

  async updateAttendance(
    organizationId: string,
    id: string,
    input: UpdateAttendanceInput
  ): Promise<AttendanceRecord> {
    return this.repository.update(organizationId, id, input);
  }
}