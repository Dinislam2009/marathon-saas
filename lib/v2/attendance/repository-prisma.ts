import type { PrismaClient } from "../../../generated/prisma-v2";
import type {
  AttendanceRecord,
  AttendanceRepository,
  CreateAttendanceInput,
  UpdateAttendanceInput,
} from "./types.ts";

type PrismaV2Client = PrismaClient;

export class PrismaAttendanceRepository implements AttendanceRepository {
  constructor(private readonly prisma: PrismaV2Client) {}

  async create(input: CreateAttendanceInput): Promise<AttendanceRecord> {
    return this.prisma.attendance.create({
      data: {
        lessonId: input.lessonId,
        studentId: input.studentId,
        status: input.status,
        note: input.note ?? null,
      },
    });
  }

  async findById(lessonId: string, studentId: string): Promise<AttendanceRecord | null> {
    return this.prisma.attendance.findUnique({
      where: { lessonId_studentId: { lessonId, studentId } },
    });
  }

  async listByLesson(lessonId: string): Promise<AttendanceRecord[]> {
    return this.prisma.attendance.findMany({
      where: { lessonId },
      orderBy: { createdAt: "asc" },
    });
  }

  async update(
    lessonId: string,
    studentId: string,
    input: UpdateAttendanceInput,
  ): Promise<AttendanceRecord> {
    return this.prisma.attendance.update({
      where: { lessonId_studentId: { lessonId, studentId } },
      data: input,
    });
  }
}
