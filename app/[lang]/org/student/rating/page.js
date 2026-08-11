import { prisma } from "@/lib/prisma";
import { getCurrentUserAction } from "@/app/actions";
import RatingClient from "./RatingClient";

export default async function StudentRatingPage() {
  let currentStudent = null;
  let dbStudents = [];

  try {
    const authUser = await getCurrentUserAction();

    // 1. Ағымдағы оқушыны базадан іздеу
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
      });
    }

    // 2. Supabase базасынан тіркелген оқушыларды ұпай ретімен оқу
    dbStudents = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        points: true,
        group: true,
        userId: true,
        marathonId: true,
        marathon: {
          select: {
            title: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        points: "desc",
      },
    });
  } catch (error) {
    console.error("⚠️ [Prisma Connection Error]: Supabase базасына қосылу мүмкін болмады:", error.message);
  }

  // 3. Базадан келген деректерді өңдеу
  const formattedLeaderboard = dbStudents.map((s, index) => {
    const fullName =
      s.name ||
      (s.user?.firstName
        ? `${s.user.firstName} ${s.user.lastName || ""}`.trim()
        : s.user?.email || "Ученик");

    const isMe = currentStudent ? s.id === currentStudent.id : false;
    const score = s.points || 0;
    const streak = score ? Math.floor(score / 10) : 0;

    const realGroup = s.group && s.group !== "Альфа тобы" 
      ? s.group 
      : s.marathon?.title || null;

    return {
      id: s.id,
      rank: index + 1,
      name: fullName,
      rawName: fullName,
      group: realGroup,
      score: score,
      streak: streak,
      isMe,
    };
  });

  return (
    <RatingClient
      initialLeaderboard={JSON.parse(JSON.stringify(formattedLeaderboard))}
      currentStudent={currentStudent ? JSON.parse(JSON.stringify(currentStudent)) : null}
    />
  );
}