export interface StudentAnalyticsOverview {
  studentId: string;
  totalLessons: number;
  attendedLessons: number;
  attendanceRate: number; // Пайыз түрінде (0 - 100%)
  totalHomeworks: number;
  completedHomeworks: number;
  homeworkCompletionRate: number; // Пайыз түрінде (0 - 100%)
}

export interface GroupAnalyticsOverview {
  groupId: string;
  totalStudents: number;
  averageAttendanceRate: number;
  averageHomeworkCompletionRate: number;
}