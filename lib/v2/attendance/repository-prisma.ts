import { PrismaClient } from "../../../generated/prisma-v2";
import { AttendanceRepository } from "./repository";
import { AttendanceRecord, MarkAttendanceInput, UpdateAttendanceInput } from "./types";

export class PrismaAttendanceRepository implements AttendanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async mark(input: MarkAttendanceInput): Promise<AttendanceRecord> {
    return this.prisma.attendance.create({
      data: {
        status: input.status,
        note: input.note,
        student: { connect: { id: input.studentId } },
        lesson: { connect: { id: input.lessonId } },
      },
    });
  }

  async findById(organizationId: string, id: string): Promise<AttendanceRecord | null> {
    return this.prisma.attendance.findFirst({
      where: {
        id,
        student: { organizationId },
      },
    });
  }

  async findMany(
    organizationId: string,
    groupId?: string,
    studentId?: string
  ): Promise<AttendanceRecord[]> {
    return this.prisma.attendance.findMany({
      where: {
        student: { organizationId },
        ...(groupId ? { lesson: { groupId } } : {}),
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { id: "desc" },
    });
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateAttendanceInput
  ): Promise<AttendanceRecord> {
    const existing = await this.findById(organizationId, id);
    if (!existing) {
      throw new Error("Attendance record not found");
    }

    return this.prisma.attendance.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.note !== undefined ? { note: input.note } : {}),
      },
    });
  }
}