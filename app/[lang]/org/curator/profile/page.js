import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import curatorProfileClient from "./curatorProfileClient";

export default async function curatorProfilePage() {
  try {
    const authUser = await getCurrentUserAction();

    // 1. Ағымдағы жүйедегі кураторды табу
    let curator = null;
    if (authUser) {
      curator = await prisma.curator.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { email: authUser.email }],
        },
        include: {
          user: true,
          organizer: true,
        },
      });
    }

    if (!curator) {
      curator = await prisma.curator.findFirst({
        include: {
          user: true,
          organizer: true,
        },
      });
    }

    if (!curator) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-800">
            Профиль куратора не найден / куратор профилі табылмады
          </h3>
        </div>
      );
    }

    // 2. Реалды метрикаларды базадан есептеу
    const studentCount = await prisma.student.count({
      where: { curatorId: curator.id },
    });

    const checkedSubmissionsCount = await prisma.submission.count({
      where: {
        student: { curatorId: curator.id },
        status: { in: ["APPROVED", "REJECTED"] },
      },
    });

    const initialData = {
      curator: JSON.parse(JSON.stringify(curator)),
      metrics: {
        studentCount,
        checkedSubmissionsCount,
      },
    };

    return <curatorProfileClient initialData={initialData} />;
  } catch (error) {
    console.error("curatorProfilePage Error:", error);
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        <h3 className="text-base font-bold text-red-600">
          Ошибка при загрузке профиля / Профильді жүктеу кезінде қате орын алды
        </h3>
        <p className="text-xs text-gray-400 mt-1">{error.message}</p>
      </div>
    );
  }
}