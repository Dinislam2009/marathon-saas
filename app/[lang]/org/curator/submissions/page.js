import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import CuratorSubmissionsClient from "./curatorSubmissionsClient";

export default async function CuratorSubmissionsPage() {
  try {
    const authUser = await getCurrentUserAction();

    if (!authUser) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-800">
            Пользователь не авторизован / Пайдаланушы жүйеге кірмеген
          </h3>
        </div>
      );
    }

    // 1. Ағымдағы куратордың профилін табу
    const currentCurator = await prisma.curator.findFirst({
      where: {
        OR: [
          { userId: authUser.id },
          { email: authUser.email }
        ],
      },
    });

    if (!currentCurator) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-800">
            Профиль куратора не найден / Куратор профилі табылмады
          </h3>
        </div>
      );
    }

    // 2. Тек осы кураторға бекітілген оқушылардың есептерін оқу
    const dbSubmissions = await prisma.submission.findMany({
      where: {
        student: {
          curatorId: currentCurator.id,
        },
      },
      include: {
        student: true,
        task: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    const initialData = JSON.parse(JSON.stringify(dbSubmissions || []));

    return <CuratorSubmissionsClient initialSubmissions={initialData} />;
  } catch (error) {
    console.error("curatorSubmissionsPage Error:", error);
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        <h3 className="text-base font-bold text-red-600">
          Ошибка при загрузке отчётов / Есептерді жүктеу кезінде қате орын алды
        </h3>
        <p className="text-xs text-gray-400 mt-1">{error?.message || "Белгісіз қате"}</p>
      </div>
    );
  }
}