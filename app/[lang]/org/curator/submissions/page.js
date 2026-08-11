import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import curatorSubmissionsClient from "./curatorSubmissionsClient";

export default async function curatorSubmissionsPage() {
  try {
    const authUser = await getCurrentUserAction();

    // 1. Ағымдағы куратордың профилін табу
    const currentcurator = await prisma.curator.findFirst({
      where: {
        OR: [{ userId: authUser?.id }, { email: authUser?.email }],
      },
    });

    if (!currentcurator) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-800">
            Профиль куратора не найден / куратор профилі табылмады
          </h3>
        </div>
      );
    }

    // 2. Тек осы кураторға бекітілген оқушылардың есептерін оқу
    const dbSubmissions = await prisma.submission.findMany({
      where: {
        student: {
          curatorId: currentcurator.id, // ⚡ ТЕК ОСЫ кураторДЫҢ ОҚУШЫЛАРЫ
        },
      },
      include: {
        student: true,
        task: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const initialData = JSON.parse(JSON.stringify(dbSubmissions || []));

    return <curatorSubmissionsClient initialSubmissions={initialData} />;
  } catch (error) {
    console.error("curatorSubmissionsPage Error:", error);
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        <h3 className="text-base font-bold text-red-600">
          Ошибка при загрузке отчётов / Есептерді жүктеу кезінде қате орын алды
        </h3>
        <p className="text-xs text-gray-400 mt-1">{error.message}</p>
      </div>
    );
  }
}