import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import MaterialsClient from "./MaterialsClient";

export default async function StudentMaterialsPage() {
  try {
    const authUser = await getCurrentUserAction();

    // 1. Ағымдағы оқушының марафонын анықтау
    let currentStudent = null;
    if (authUser) {
      currentStudent = await prisma.student.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { email: authUser.email }],
        },
      });
    }

    if (!currentStudent) {
      currentStudent = await prisma.student.findFirst();
    }

    // 2. Базадан осы оқушының марафонына немесе жалпы оқу базасына тиесілі материалдарды алу
    const marathonId = currentStudent?.marathonId;
    let dbMaterials = [];

    if (prisma.material) {
      dbMaterials = await prisma.material.findMany({
        where: marathonId ? { OR: [{ marathonId }, { marathonId: null }] } : {},
        orderBy: { createdAt: "desc" },
      });
    }

    // 3. Егер базада материалдар әлі сақталмаған болса, дефолтты дайын құрылым
    if (!dbMaterials || dbMaterials.length === 0) {
      dbMaterials = [
        {
          id: "m1",
          titleKz: "1-Апта: Интенсив тест сұрақтары мен жауаптары",
          titleRu: "1-Неделя: Вопросы и ответы интенсивного теста",
          type: "pdf",
          categoryKz: "Тесттер",
          categoryRu: "Тесты",
          size: "2.4 MB",
          date: "20 Июль, 2026",
          fileUrl: "#",
        },
        {
          id: "m2",
          titleKz: "Математикалық сауаттылық: Барлық формулалар жинағы",
          titleRu: "Математическая грамотность: Сборник всех формул",
          type: "pdf",
          categoryKz: "Шпоры & Формулалар",
          categoryRu: "Шпоры & Формулы",
          size: "5.1 MB",
          date: "18 Июль, 2026",
          fileUrl: "#",
        },
        {
          id: "m3",
          titleKz: "Информатика: Python бастауыш алгоритмдері (Разбор)",
          titleRu: "Информатика: Начальные алгоритмы Python (Разбор)",
          type: "video",
          categoryKz: "Бейнесабақтар",
          categoryRu: "Видеоуроки",
          duration: "35 мин",
          date: "15 Июль, 2026",
          link: "https://youtube.com",
        },
        {
          id: "m4",
          titleKz: "Уақытты тиімді басқару (Pomodoro техникасы)",
          titleRu: "Эффективное управление временем (Техника Pomodoro)",
          type: "doc",
          categoryKz: "Гайдтар",
          categoryRu: "Гайды",
          size: "1.1 MB",
          date: "10 Июль, 2026",
          fileUrl: "#",
        },
      ];
    }

    return <MaterialsClient initialMaterials={JSON.parse(JSON.stringify(dbMaterials))} />;
  } catch (error) {
    console.error("Материалдарды жүктеу қатесі:", error);
    return (
      <div className="p-6 text-center text-red-500 bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        Ошибка при загрузке материалов / Материалдарды жүктеу кезінде серверлік қате орын алды.
      </div>
    );
  }
}