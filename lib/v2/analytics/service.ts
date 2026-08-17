import { PrismaClient, AttendanceStatus } from "../../../generated/prisma-v2";
import { StudentAnalyticsOverview, GroupAnalyticsOverview } from "./types";

export class AnalyticsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getStudentAnalytics(
    organizationId: string,
    studentId: string
  ): Promise<StudentAnalyticsOverview> {
    // 1. Студенттің сабаққа қатысу деректерін алу
    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId,
        student: { organizationId },
      },
    });

    const totalLessons = attendances.length;
    const attendedLessons = attendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE
    ).length;

    const attendanceRate =
      totalLessons > 0 ? Math.round((attendedLessons / totalLessons) * 100) : 0;

    // 2. Үй тапсырмасының орындалуын есептеу
    // Студент тіркелген топтардағы сабақтардың үй тапсырмаларын жинау
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { groupId: true },
    });

    const groupIds = enrollments
      .map((e) => e.groupId)
      .filter((id): id is string => id !== null);

    const homeworks = await this.prisma.homework.findMany({
      where: {
        lesson: {
          groupId: { in: groupIds },
          course: { organizationId },
        },
      },
    });

    const totalHomeworks = homeworks.length;
    // Әзірге орындалған тапсырмаларды белгілеу логикасы болса, осы жерде есептеледі
    const completedHomeworks = 0; 
    const homeworkCompletionRate =
      totalHomeworks > 0 ? Math.round((completedHomeworks / totalHomeworks) * 100) : 0;

    return {
      studentId,
      totalLessons,
      attendedLessons,
      attendanceRate,
      totalHomeworks,
      completedHomeworks,
      homeworkCompletionRate,
    };
  }

  async getGroupAnalytics(
    organizationId: string,
    groupId: string
  ): Promise<GroupAnalyticsOverview> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        groupId,
        student: { organizationId },
      },
      select: { studentId: true },
    });

    const totalStudents = enrollments.length;

    if (totalStudents === 0) {
      return {
        groupId,
        totalStudents: 0,
        averageAttendanceRate: 0,
        averageHomeworkCompletionRate: 0,
      };
    }

    let totalAttendanceRate = 0;
    let totalHomeworkRate = 0;

    for (const enrollment of enrollments) {
      const studentStats = await this.getStudentAnalytics(
        organizationId,
        enrollment.studentId
      );
      totalAttendanceRate += studentStats.attendanceRate;
      totalHomeworkRate += studentStats.homeworkCompletionRate;
    }

    return {
      groupId,
      totalStudents,
      averageAttendanceRate: Math.round(totalAttendanceRate / totalStudents),
      averageHomeworkCompletionRate: Math.round(totalHomeworkRate / totalStudents),
    };
  }
}