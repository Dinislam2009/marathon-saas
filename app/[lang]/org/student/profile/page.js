import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import ProfileClient from "./ProfileClient";

export default async function StudentProfilePage() {
  try {
    const authUser = await getCurrentUserAction();

    // 1. Ағымдағы жүйедегі оқушыны табу
    let studentRecord = null;
    if (authUser) {
      studentRecord = await prisma.student.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { email: authUser.email }],
        },
        include: { 
          submissions: true,
          matrixTasks: true,
          marathon: true,
        },
      });
    }

    if (!studentRecord) {
      studentRecord = await prisma.student.findFirst({
        include: { 
          submissions: true,
          matrixTasks: true,
          marathon: true,
        },
        orderBy: { joinedAt: "desc" },
      });
    }

    if (!studentRecord) {
      return (
        <div className="flex flex-col items-center justify-center h-64 p-6 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-900">
            Профиль не найден / Профиль табылмады
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            В базе пока нет зарегистрированных учеников. / Базада әлі оқушылар тіркелмеген.
          </p>
        </div>
      );
    }

    return <ProfileClient initialStudent={JSON.parse(JSON.stringify(studentRecord))} />;
  } catch (error) {
    console.error("Профиль жүктеу қатесі:", error);
    return (
      <div className="flex items-center justify-center h-64 p-6 text-red-500 font-medium bg-white rounded-3xl border border-gray-100 shadow-sm font-sans text-center">
        Произошла ошибка на сервере. / Серверде қате шықты. Базамен байланысты тексеріңіз.
      </div>
    );
  }
}