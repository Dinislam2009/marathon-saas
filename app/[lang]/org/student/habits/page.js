import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import HabitsClient from "./HabitsClient";

export default async function StudentHabitsPage() {
  try {
    const authUser = await getCurrentUserAction();
    let student = null;

    if (authUser) {
      student = await prisma.student.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { email: authUser.email }],
        },
        include: { habits: true },
      });
    }

    if (!student) {
      student = await prisma.student.findFirst({
        include: { habits: true },
      });
    }

    const habitsList = student?.habits && student.habits.length > 0 
      ? student.habits 
      : [
          { id: "h1", titleKz: "Ерте тұру (07:00)", titleRu: "Ранний подъём (07:00)", categoryKz: "Денсаулық & Тәртіп", categoryRu: "Здоровье & Дисциплина", streak: 14, completedToday: true, weeklyProgress: [true, true, true, true, true, true, true] },
          { id: "h2", titleKz: "20 минут кітап / конспект оқу", titleRu: "20 минут чтения книг / конспектов", categoryKz: "Оқу & Даму", categoryRu: "Учёба & Развитие", streak: 8, completedToday: true, weeklyProgress: [true, false, true, true, true, true, true] },
          { id: "h3", titleKz: "Информатика: 15 тест орындау", titleRu: "Информатика: выполнить 15 тестов", categoryKz: "Марафон тапсырмасы", categoryRu: "Задание марафона", streak: 5, completedToday: false, weeklyProgress: [true, true, false, true, true, true, false] },
          { id: "h4", titleKz: "Математика: 5 формула жаттау", titleRu: "Математика: выучить 5 формул", categoryKz: "Марафон тапсырмасы", categoryRu: "Задание марафона", streak: 12, completedToday: false, weeklyProgress: [true, true, true, true, true, false, false] },
        ];

    return (
      <HabitsClient 
        studentId={student?.id || "demo-student"} 
        initialHabits={JSON.parse(JSON.stringify(habitsList))} 
      />
    );
  } catch (error) {
    console.error("Habits load error:", error);
    return (
      <div className="p-6 text-center text-red-500 bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        Ошибка при загрузке привычек / Әдеттерді жүктеу кезінде қате орын алды.
      </div>
    );
  }
}