import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import GroupClient from "./GroupClient";

export default async function StudentGroupPage() {
  try {
    // 1. Жүйеге кіріп тұрған оқушыны оқу
    const authUser = await getCurrentUserAction();

    let currentStudent = null;
    if (authUser) {
      currentStudent = await prisma.student.findFirst({
        where: {
          OR: [
            { userId: authUser.id },
            { email: authUser.email }
          ]
        },
        include: { 
          group: {
            include: {
              curator: true,
              marathon: true,
            }
          }, 
          marathon: true, 
          curator: true 
        }
      });
    }

    if (!currentStudent) {
      currentStudent = await prisma.student.findFirst({
        include: { 
          group: {
            include: {
              curator: true,
              marathon: true,
            }
          }, 
          marathon: true, 
          curator: true 
        },
        orderBy: { joinedAt: "desc" }
      });
    }

    if (!currentStudent) {
      return (
        <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
          <h3 className="text-base font-bold text-gray-800">
            Группа не найдена / Топ табылмады
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            В базе пока нет зарегистрированных учеников. / Базада әлі оқушылар тіркелмеген.
          </p>
        </div>
      );
    }

    // 2. Осы топқа (groupId) немесе марафонға тиесілі барлық студенттерді жүктеу
    const groupId = currentStudent.groupId;
    const marathonId = currentStudent.marathonId;

    const dbStudents = await prisma.student.findMany({
      where: groupId ? { groupId } : { marathonId },
      include: {
        submissions: true,
        user: true,
      },
      orderBy: {
        points: "desc"
      }
    });

    // 3. Форматтау (Реалды оқушылар)
    const formattedMembers = dbStudents.map((s, index) => {
      const isMe = s.id === currentStudent.id;
      const streak = s.points ? Math.floor(s.points / 10) : 0;
      const tasksCount = s.submissions?.filter((sub) => sub.status === "SUBMITTED")?.length || 0;
      const fullName = s.name || (s.user ? `${s.user.firstName || ""} ${s.user.lastName || ""}`.trim() : "Ученик");

      return {
        id: s.id,
        name: isMe ? fullName : fullName,
        rawName: fullName,
        roleIndex: index === 0 ? 1 : 2, // 1: Капитан, 2: Студент
        streak: streak,
        points: s.points || 0,
        tasksCount,
        avatarColor: isMe 
          ? "bg-indigo-100 text-indigo-700" 
          : index === 0 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700",
        status: "online",
        rank: index + 1,
        isMe,
      };
    });

    // Шынайы куратор және топ атаулары
    const activeGroup = currentStudent.group;
    const groupTitle = activeGroup?.name || null;
    const curatorName = activeGroup?.curator?.name || currentStudent.curator?.name || null;
    const marathonTitle = activeGroup?.marathon?.title || currentStudent.marathon?.title || null;

    const groupHeaderInfo = {
      groupTitle,
      curatorName,
      marathonTitle,
      members: formattedMembers,
    };

    return <GroupClient initialData={JSON.parse(JSON.stringify(groupHeaderInfo))} />;
  } catch (error) {
    console.error("Топ деректерін жүктеу қатесі:", error);
    return (
      <div className="p-6 text-center text-red-500 bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        Ошибка при получении данных группы / Топ деректерін базадан алу кезінде қате орын алды.
      </div>
    );
  }
}