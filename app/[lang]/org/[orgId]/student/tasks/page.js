import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions";
import StudentTasksClient from "./StudentTasksClient";

export default async function StudentTasksPage() {
  try {
    const authUser = await getCurrentUser();

    let currentStudent = null;
    if (authUser) {
      currentStudent = await prisma.student.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { email: authUser.email }],
        },
        include: { marathon: true },
      });
    }

    if (!currentStudent) {
      currentStudent = await prisma.student.findFirst({
        include: { marathon: true },
        orderBy: { joinedAt: "desc" },
      });
    }

    if (!currentStudent || !currentStudent.marathonId) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-800">
            Марафон не найден / Марафон табылмады
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Вы еще не зарегистрированы ни на один марафон. / Сіз әлі ешқандай марафонға тіркелмегенсіз.
          </p>
        </div>
      );
    }

    // ⚡ Тапсырмаларды оқу
    const dbTasks = await prisma.task.findMany({
      where: { marathonId: currentStudent.marathonId },
      orderBy: { createdAt: "asc" },
    });

    // ⚡ Оқушының өткізген есептерін оқу
    const dbSubmissions = await prisma.submission.findMany({
      where: { studentId: currentStudent.id },
    });

    const initialData = {
      student: {
        id: currentStudent.id,
        name: currentStudent.name,
        points: currentStudent.points || 0,
      },
      marathon: {
        id: currentStudent.marathon?.id,
        title: currentStudent.marathon?.title || "Марафон",
        durationDays: currentStudent.marathon?.durationDays || 21,
      },
      tasks: JSON.parse(JSON.stringify(dbTasks)),
      submissions: JSON.parse(JSON.stringify(dbSubmissions)),
    };

    return <StudentTasksClient initialData={initialData} />;
  } catch (error) {
    console.error("StudentTasksPage Server Error:", error);
    return (
      <div className="p-6 text-center text-red-500 bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        Ошибка при загрузке заданий. Попробуйте проверить еще раз. / Сабақтарды жүктеу кезінде қате орын алды. Қайтадан тексеріп көріңіз.
      </div>
    );
  }
}