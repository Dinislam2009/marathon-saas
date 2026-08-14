import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions";
import MatrixClient from "./MatrixClient";

export default async function StudentMatrixPage() {
  try {
    const authUser = await getCurrentUser();
    let student = null;

    if (authUser) {
      student = await prisma.student.findFirst({
        where: {
          OR: [{ userId: authUser.id }, { email: authUser.email }],
        },
        include: { matrixTasks: true },
      });
    }

    if (!student) {
      student = await prisma.student.findFirst({
        include: { matrixTasks: true },
      });
    }

    const tasksList = student?.matrixTasks || [];

    return (
      <MatrixClient
        studentId={student?.id || "demo-student"}
        initialTasks={JSON.parse(JSON.stringify(tasksList))}
      />
    );
  } catch (error) {
    console.error("Matrix load error:", error);
    return (
      <div className="p-6 text-center text-red-500 bg-white rounded-3xl border border-gray-100 shadow-sm font-sans">
        Ошибка при загрузке задач матрицы / Матрица тапсырмаларын жүктеу кезінде қате орын алды.
      </div>
    );
  }
}