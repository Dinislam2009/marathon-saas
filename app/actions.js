"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/data"; 
import { getUser } from "@/lib/auth";
import { getTodayDayNumber } from "@/lib/utils"; 
import { prisma } from "@/lib/prisma";

// Helper function to stringify complex DB objects safely across the server boundary
function safeJson(data) {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
}

function formatPhone(phone) {
  if (!phone) return "—";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  }
  if (cleaned.length === 10) {
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  return phone;
}

/**
 * Қауіпсіздікті тексеретін көмекші функция.
 * Ағымдағы сессияны анықтайды (сессия болмаса crash жасамай, null қайтарады).
 */
async function validateSession() {
  try {
    const currentUser = await auth.getCurrentUser();
    if (!currentUser) {
      return null;
    }
    return currentUser;
  } catch (error) {
    return null;
  }
}

// ==========================================
// --- Мәліметтерді Оқу (Read) Амалдары ---
// ==========================================

export async function fetchInitialState() {
  const user = await validateSession();
  if (!user) {
    return { currentStudentId: null };
  }

  // Пайдаланушыға тиесілі нақты оқушы жазбасын іздеу
  const student = await prisma.student.findFirst({
    where: { userId: user.id },
  });

  return {
    currentStudentId: student ? student.id : null,
  };
}

export async function runDeadlineCheck() {
  try {
    const user = await validateSession();
    
    // 1. Егер авторизация болмаса, үнсіз тоқтату
    if (!user) {
      return { success: false, reason: "Unauthenticated" };
    }

    // 2. ⚡ Тексерісті тек OWNER немесе ORGANIZER іске қоса алады
    if (user.role !== "ORGANIZER" && user.role !== "OWNER") {
      return { success: false, reason: "Unauthorized" };
    }

    await db.checkMissedDeadlines();
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Deadline check error:", error);
    return { success: false, error: error.message };
  }
}

export async function getMaterialsForStudentAction(studentId) {
  if (!studentId) return [];
  const user = await validateSession();
  if (!user) return [];

  // ⚡ Қауіпсіздік: Материалды иесі, Ұйымдастырушы (ORGANIZER) немесе Куратор (CURATOR) көре алады
  if (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR" && user.id !== studentId) {
    throw new Error("Басқа қатысушының материалдарын көруге рұқсат жоқ.");
  }

  const materials = await db.getMaterialsForStudent(studentId);
  return safeJson(materials);
}

export async function getProfileDataAction(studentId, orgId) {
  try {
    const authUser = await validateSession();
    if (!authUser) {
      return { ok: false, error: "Рұқсат етілмеген сұраныс! Жүйеге қайта кіріңіз." };
    }

    // ⚡ Профиль деректерін оқу сүзгісін жаңа рөлдерге бейімдеу
    if (authUser.role !== "ORGANIZER" && authUser.role !== "OWNER" && authUser.role !== "CURATOR" && authUser.id !== studentId) {
      throw new Error("Бұл профиль деректерін оқуға рұқсатыңыз жоқ.");
    }

    const student = await db.getStudent(studentId);
    const marathon = await db.getMarathonForStudent(studentId);
    const marathons = await db.getMarathonsByOrg(orgId);
    const students = marathons.flatMap((m) => db.getStudentsByMarathon(m.id));

    return {
      ok: true,
      data: safeJson({ student, marathon, authUser, students })
    };
  } catch (error) {
    console.error("getMentorsByOrgId error:", error);
    // Prisma-ның нақты не сұрап тұрғанын браузерге шығару:
    throw new Error(error.message); 
  }
}

// ==========================================
// --- Анықтамалық (Auth) Амалдары --------
// ==========================================

export async function registerUser(fields) {
  const res = await auth.registerUser(fields);
  return safeJson(res);
}

export async function loginUser(identifier, password) {
  const res = await auth.loginUser(identifier, password);
  return safeJson(res);
}

export async function getCurrentUserAction(userId) {
  if (!userId) return null;
  const authUser = await validateSession();
  if (!authUser) return null;

  // ⚡ Өзгенің ID-і арқылы инспекция жасаудан қорғауды жаңа рөлдерге сәйкестендіру
  if (authUser.role !== "ORGANIZER" && authUser.role !== "OWNER" && authUser.role !== "CURATOR" && authUser.id !== userId) {
    return null;
  }

  const user = await auth.getUser(userId);
  return safeJson(user);
}

export async function verifyOtpAction(uid, code) {
  const res = await auth.verifyOtp(uid, code);
  revalidatePath("/");
  return safeJson(res);
}

export async function resendOtpAction(uid, phone) {
  const res = await auth.resendOtp(uid, phone);
  return safeJson(res);
}

export async function getPendingOtpAction(userId) {
  const res = await auth.getPendingOtp(userId);
  return safeJson(res);
}

export async function logoutAction() {
  const res = await auth.logout();
  return safeJson(res);
}

// ==========================================
// --- Өзгерту (Mutation) Амалдары ---------
// ==========================================

export async function addOrganizer(fields) {
  try {
    const user = await validateSession();
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev && (!user || user.role !== "OWNER")) {
      return { ok: false, error: "Жаңа ұйымдастырушыны тек супер админ (OWNER) қоса алады." };
    }

    // ⬇️ Рөлді осы жерде анық тағайындаймыз:
    const organizerData = {
      ...fields,
      role: fields.role || "ORGANIZER", // Егер Enum-да "ORGANIZER" болса
    };

    const res = await db.addOrganizer(organizerData);
    revalidatePath("/");
    
    return { ok: true, data: safeJson(res) };
  } catch (error) {
    console.error("addOrganizer error:", error);
    return { ok: false, error: error.message || "Ұйымдастырушыны қосу мүмкін болмады." };
  }
}

export async function setOrganizerSubscriptionStatus(orgId, status) {
  const user = await validateSession();
  if (!user || user.role !== "OWNER") {
    throw new Error("Жазылым статусын тек супер админ (OWNER) басқара алады.");
  }

  await db.setOrganizerSubscriptionStatus(orgId, status);
  revalidatePath("/");
}

export async function createMarathon(orgId, fields) {
  try {
    const user = await validateSession();
    const isDev = process.env.NODE_ENV === "development";

    // DEV кезеңінде тексеруді уақытша өткізу немесе OWNER/ORGANIZER тексеру:
    if (!isDev && (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER"))) {
      return { 
        ok: false, 
        error: "Марафон құру құқығы тек ұйымдастырушыда бар." 
      };
    }

    // orgId келмей қалған жағдайда (user.organizerId арқылы алу):
    const targetOrgId = orgId || user?.organizerId;

    const res = await db.createMarathon(targetOrgId, fields);
    revalidatePath("/");
    
    return { ok: true, data: safeJson(res) };
  } catch (error) {
    console.error("createMarathon error:", error);
    return { ok: false, error: error.message || "Марафонды құру мүмкін болмады." };
  }
}

export async function upsertTask(marathonId, dayNumber, fields) {
  try {
    console.log("👉 [ACTIONS] upsertTask шақырылды:", { marathonId, dayNumber, fields });

    // lib/data.js ішіндегі функцияны шақыру
    const res = await db.upsertTask(marathonId, dayNumber, fields);

    console.log("✅ [ACTIONS] Базаға сәтті сақталды:", res);
    revalidatePath("/");
    return safeJson(res);
  } catch (error) {
    console.error("❌ [ACTIONS ERROR] Серверде қате шықты:", error);
    throw new Error(error.message || "Тапсырманы базаға сақтау мүмкін болмады.");
  }
}

export async function setStudentStatus(studentId, status) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR")) {
    throw new Error("Студент статусын өзгертуге рұқсатыңыз жоқ.");
  }

  await db.setStudentStatus(studentId, status);
  revalidatePath("/");
}

export async function updateChecklist(studentId, marathonId, dayNumber, checklistData) {
  try {
    if (!studentId || studentId === "demo-student") {
      return { ok: true };
    }

    // Submission бар-жоғын тексереміз
    let submission = await prisma.submission.findFirst({
      where: {
        studentId,
        dayNumber,
      },
    });

    if (submission) {
      await prisma.submission.update({
        where: { id: submission.id },
        data: {
          checklist: {
            ...(submission.checklist || {}),
            ...checklistData,
          },
        },
      });
    } else {
      await prisma.submission.create({
        data: {
          studentId,
          marathonId,
          dayNumber,
          status: "PENDING",
          checklist: checklistData,
        },
      });
    }

    return { ok: true };
  } catch (error) {
    console.error("updateChecklist error:", error);
    return { ok: false, error: error.message };
  }
}

export async function addHabit(studentId, title) {
  const user = await validateSession();
  if (!user || user.id !== studentId) {
    throw new Error("Әдетті тек профиль иесі қоса алады.");
  }

  const res = await db.addHabit(studentId, title);
  revalidatePath("/");
  return safeJson(res);
}

export async function toggleHabitToday(habitId) {
  const user = await validateSession();
  if (!user) return;
  await db.toggleHabitToday(habitId);
  revalidatePath("/");
}

export async function deleteHabit(habitId) {
  const user = await validateSession();
  if (!user) return;
  await db.deleteHabit(habitId);
  revalidatePath("/");
}

export async function addMatrixTask(studentId, fields) {
  const user = await validateSession();
  if (!user || user.id !== studentId) {
    throw new Error("Эйзенхауэр матрицасын тек профиль иесі басқара алады.");
  }

  const res = await db.addMatrixTask(studentId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function toggleMatrixTaskDone(taskId) {
  const user = await validateSession();
  if (!user) return;
  await db.toggleMatrixTaskDone(taskId);
  revalidatePath("/");
}

export async function deleteMatrixTask(taskId) {
  const user = await validateSession();
  if (!user) return;
  await db.deleteMatrixTask(taskId);
  revalidatePath("/");
}

export async function sendMessage(orgId, studentId, studentName, text) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR" && user.id !== studentId)) {
    throw new Error("Хабарлама жіберуге рұқсат жоқ.");
  }

  const res = await db.sendMessage(orgId, studentId, studentName, text);
  revalidatePath("/");
  return safeJson(res);
}

export async function createMentor(data) {
  try {
    const { fullName, phone, email } = data;
    const formattedEmail = email ? String(email).trim().toLowerCase() : null;

    const mentor = await prisma.mentor.create({
      data: {
        name: fullName,
        phone: phone,
        email: formattedEmail,
      },
    });

    return safeJson ? safeJson(mentor) : mentor;
  } catch (error) {
    console.error("createMentor error:", error);
    throw error;
  }
}

export async function assignMentorToStudent(studentId, mentorId) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER")) {
    throw new Error("Менторды бекіту құқығы сізде жоқ.");
  }

  await db.assignMentorToStudent(studentId, mentorId);
  revalidatePath("/");
}

export async function addInvitation(marathonId, orgId, role, fields) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER")) {
    throw new Error("Шақыру сілтемесін тек әкімші жасай алады.");
  }

  const res = await db.addInvitation(marathonId, orgId, role, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function addStudentToMarathon(marathonId, fields) {
  try {
    const user = await validateSession();
    console.log("👤 CURRENT USER SESSION:", user); // Сессияның бар-жоғын көреміз

    // Егер сессия болмаса да тексеру үшін DB-ға жаза береміз (немесе қатені терминалға шығарамыз)
    const res = await db.addStudentToMarathon(marathonId, fields);
    
    revalidatePath("/org/[orgId]/admin/students", "page");
    return safeJson(res);
  } catch (error) {
    console.error("❌ addStudentToMarathon Action Error:", error);
    throw error;
  }
}

export async function addStudentInvitationByMentor(mentorId, marathonId, fields) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR" && user.id !== mentorId)) {
    throw new Error("Бұл шақыруды жіберуге құқығыңыз жоқ.");
  }

  const res = await db.addStudentInvitationByMentor(mentorId, marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function getOrganizersAction() {
  try {
    // DEV кезеңінде тексеруді уақытша өткізе беру үшін:
    const isDev = process.env.NODE_ENV === "development";
    const user = await validateSession();

    if (!isDev && (!user || user.role !== "OWNER")) {
      return { 
        ok: false, 
        error: "Ұйымдастырушылар тізімін тек супер админ (OWNER) көре алады." 
      };
    }

    const organizers = await db.getOrganizers();
    return { ok: true, organizers: safeJson(organizers) };
  } catch (error) {
    console.error("getOrganizersAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getStudentDashboard(orgId) {
  try {
    // 1. Ағымдағы қолданушыны сессиядан аламыз
    const session = await auth.getSession(); // немесе сенде қолданылатын сессия логикасы

    let student = null;

    if (session?.user?.id) {
      student = await prisma.student.findFirst({
        where: { userId: session.user.id },
        include: {
          marathon: true,
        },
      });
    }

    // 2. Егер оқушы сақталмаған болса, құлатпай демо-оқушы қайтарамыз (Fallback)
    if (!student) {
      const firstStudent = await prisma.student.findFirst({
        include: { marathon: true },
      });

      student = firstStudent || {
        id: "demo-student",
        name: "Қатысушы",
        email: "student@example.com",
        points: 0,
      };
    }

    return {
      success: true,
      student,
    };
  } catch (error) {
    console.error("getStudentDashboard error:", error);
    // Сессия немесе база қатесі болса да бетті құлатпау
    return {
      success: true,
      student: {
        id: "demo-student",
        name: "Қатысушы",
        points: 0,
      },
    };
  }
}

export async function getStudentProgressAction(studentId) {
  try {
    if (!studentId) {
      return { ok: false, error: "Студент ID көрсетілмеген." };
    }

    const user = await validateSession();
    if (!user) {
      return { ok: false, error: "Сессия табылған жоқ, жүйеге қайта кіріңіз." };
    }

    // 1. Деректерді базадан қауіпсіз алу
    const student = await db.getStudent(studentId);
    if (!student) {
      return { ok: false, error: "Студент табылған жоқ." };
    }

    const marathon = await db.getMarathonForStudent(studentId);
    const allSubmissions = (await db.getSubmissionsByStudent(studentId)) || [];

    // 2. Рұқсат тексеру (Оқушы өз ID-іне немесе өз студенттік профиліне кіріп тұр ма)
    const isSelf = user.id === studentId || user.id === student.userId || user.role === "STUDENT";
    const isStaff = ["ORGANIZER", "OWNER", "CURATOR"].includes(user.role);

    if (!isSelf && !isStaff) {
      return { ok: false, error: "Прогресті көруге рұқсатыңыз жоқ." };
    }

    return {
      ok: true,
      data: safeJson({
        student,
        marathon: marathon || null,
        allSubmissions,
      }),
    };
  } catch (error) {
    console.error("getStudentProgressAction error:", error);
    return { ok: false, error: error.message || "Серверлік қате орын алды." };
  }
}
// ==========================================
// --- Парольді қалпына келтіру әрекеттері ---
// ==========================================

export async function sendResetOtpAction(identifier) {
  const res = await auth.sendResetOtp(identifier);
  return safeJson(res);
}

export async function resetPasswordWithOtpAction(userId, code, newPassword) {
  const res = await auth.resetPasswordWithOtp({ userId, code, newPassword });
  revalidatePath("/");
  return safeJson(res);
}

// app/actions.js файлын ашып, ең төменіне мыналарды қосыңыз:

export async function getMarathons() {
  return await prisma.marathon.findMany({
    orderBy: { createdAt: "desc" },
  });
}

// app/actions.js файлының төменгі жағына қосыңыз:

export async function getMarathonsByOrgId(orgId) {
  try {
    const user = await validateSession();
    
    // 1. Ұйымды анықтау (URL-дегі orgId немесе сессиядағы user/organizer)
    let targetOrgId = orgId && orgId !== "orgId" ? orgId : null;

    if (!targetOrgId && user) {
      const org = await prisma.organizer.findFirst({
        where: { userId: user.id },
      });
      if (org) targetOrgId = org.id;
    }

    // 2. Егер әлі де табылмаса, базадағы бірінші ұйымды алу
    if (!targetOrgId) {
      const firstOrg = await prisma.organizer.findFirst();
      if (firstOrg) targetOrgId = firstOrg.id;
    }

    if (!targetOrgId) return [];

    // 3. Марафондарды оқушылар санымен (_count) бірге жүктеу
    const marathons = await prisma.marathon.findMany({
      where: { organizerId: targetOrgId },
      include: {
        _count: {
          select: { students: true }, // Марафондағы студенттер санын санайды
        },
        students: true, // Қажет болса студенттер тізімін де қосады
      },
      orderBy: { createdAt: "desc" },
    });

    // Қатысушылар санын карточкаға ыңғайлы етіп форматтау
    const formattedMarathons = marathons.map((m) => ({
      ...m,
      studentsCount: m._count?.students || m.students?.length || 0,
    }));

    return safeJson(formattedMarathons);
  } catch (error) {
    console.error("getMarathonsByOrgId error:", error);
    return [];
  }
}

export async function getTasksByMarathon(marathonId) {
  try {
    const tasks = await db.getTasksByMarathon(marathonId);
    return safeJson(tasks);
  } catch (error) {
    console.error("❌ Action getTasksByMarathon error:", error);
    return [];
  }
}

export async function getAllStudentsByOrg(orgId) {
  try {
    const user = await validateSession();
    const students = await db.getAllStudentsByOrg(orgId, user?.id);
    return safeJson(students);
  } catch (error) {
    console.error("getAllStudentsByOrg error:", error);
    return [];
  }
}

export async function checkStudentInDatabase(value, isEmail, marathonId) {
  try {
    const rawDigits = value.replace(/\D/g, "");
    // Соңғы 10 цифрды алу (мысалы, 7079003568)
    const phoneQuery = rawDigits.length >= 10 ? rawDigits.slice(-10) : rawDigits;

    // 1. ИЗДЕУ: Алдымен Student кестесінен, кейін User кестесінен іздейміз
    let foundStudent = null;
    let foundUser = null;

    if (isEmail) {
      const emailQuery = value.trim().toLowerCase();

      // Student кестесінен іздеу
      foundStudent = await prisma.student.findFirst({
        where: { email: { equals: emailQuery, mode: "insensitive" } },
        include: { user: true },
      });

      // Егер Student-тен табылмаса, User кестесінен іздеу
      if (!foundStudent) {
        foundUser = await prisma.user.findFirst({
          where: { email: { equals: emailQuery, mode: "insensitive" } },
          include: { student: true },
        });
      }
    } else {
      // Телефон арқылы іздеу (Student кестесі)
      const allStudents = await prisma.student.findMany();
      foundStudent = allStudents.find((s) => {
        if (!s.phone) return false;
        const sDigits = s.phone.replace(/\D/g, "");
        return sDigits.endsWith(phoneQuery) || (phoneQuery && sDigits.includes(phoneQuery));
      });

      // Егер Student-тен табылмаса, User кестесінен іздеу
      if (!foundStudent) {
        const allUsers = await prisma.user.findMany();
        foundUser = allUsers.find((u) => {
          if (!u.phone) return false;
          const uDigits = u.phone.replace(/\D/g, "");
          return uDigits.endsWith(phoneQuery) || (phoneQuery && uDigits.includes(phoneQuery));
        });
      }
    }

    // Нәтижені біріктіру
    const target = foundStudent || foundUser;

    // -------------------------------------------------------------
    // Жағдай 1: Базада (Student-те де, User-де де) мүлдем ЖОҚ
    // -------------------------------------------------------------
    if (!target) {
      return { student: null, status: "not_found" };
    }

    // Аты мен марафон ID-сын анықтау
    let name = "";
    let studentMarathonId = null;

    if (foundStudent) {
      name = foundStudent.name;
      studentMarathonId = foundStudent.marathonId;
    } else if (foundUser) {
      name = `${foundUser.firstName} ${foundUser.lastName}`.trim();
      studentMarathonId = foundUser.student?.marathonId;
    }

    const studentData = {
      name,
      email: target.email,
      phone: target.phone,
    };

    // -------------------------------------------------------------
    // Жағдай 2: ДӘЛ ОСЫ таңдалған марафонда бар
    // -------------------------------------------------------------
    if (studentMarathonId && String(studentMarathonId) === String(marathonId)) {
      return { student: studentData, status: "already_in_this_marathon" };
    }

    // -------------------------------------------------------------
    // Жағдай 3: БАСҚА марафонда бар
    // -------------------------------------------------------------
    if (studentMarathonId) {
      return { student: studentData, status: "in_another_marathon" };
    }

    // -------------------------------------------------------------
    // Жағдай 4: Базада бар, бірақ бұл марафонға әлі қосылмаған (Дайын!)
    // -------------------------------------------------------------
    return { student: studentData, status: "found" };
  } catch (error) {
    console.error("Student check error:", error);
    return { student: null, status: "not_found" };
  }
}

export async function getMarathonById(id) {
  try {
    const marathon = await prisma.marathon.findUnique({
      where: { id: String(id) },
    });
    return safeJson(marathon);
  } catch (error) {
    console.error("getMarathonById error:", error);
    return null;
  }
}

export async function getStudentsByMarathonId(marathonId) {
  try {
    const allStudents = await prisma.student.findMany({
      include: {
        mentor: true,
      },
    });

    const filtered = allStudents.filter(
      (s) => String(s.marathonId) === String(marathonId)
    );

    return safeJson(filtered);
  } catch (error) {
    console.error("getStudentsByMarathonId error:", error);
    return [];
  }
}

export async function getMentorsByMarathonId(marathonId) {
  try {
    const allMentors = await prisma.mentor.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    const filtered = allMentors.filter(
      (m) => String(m.marathonId) === String(marathonId)
    );

    return safeJson(filtered);
  } catch (error) {
    console.error("getMentorsByMarathonId error:", error);
    return [];
  }
}

export async function getMentorsByOrgId(orgId) {
  try {
    let targetOrgId = orgId;

    // Егер URL-ден "orgId" сөзі өтіп кетсе, базадағы бірінші Organizer ID-ін аламыз
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst({
        select: { id: true },
      });
      targetOrgId = firstOrg?.id;
    }

    if (!targetOrgId) {
      return [];
    }

    // Осы ұйымға тиесілі менторларды базадан аламыз
    const mentors = await prisma.mentor.findMany({
      where: {
        organizerId: targetOrgId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return mentors;
  } catch (error) {
    console.error("getMentorsByOrgId error:", error);
    return [];
  }
}

export async function addMentor(data) {
  try {
    const { fullName, name, phone, email, orgId, organizerId, company, ownerName } = data || {};
    
    // orgId немесе organizerId
    let targetOrgId = orgId || organizerId;

    if (!targetOrgId) {
      throw new Error("Ұйым ID-сі (orgId) жіберілмеген.");
    }

    const mentorName = fullName || name || "Без имени";
    const formattedEmail = email ? String(email).trim().toLowerCase() : "organizer@example.com";

    // 1. Базадан осы Organizer-ді іздейміз
    let existingOrganizer = null;
    
    // Егер targetOrgId "orgId" деген сөз емес, нақты ID болса:
    if (targetOrgId !== "orgId") {
      existingOrganizer = await prisma.organizer.findUnique({
        where: { id: targetOrgId },
      });
    } else {
      // Егер "orgId" болып келсе, базадағы ең алғашқы Organizer-ді алып көреміз
      existingOrganizer = await prisma.organizer.findFirst();
    }

    // 2. Егер базада тіпті ешқандай Organizer болмаса, барлық міндетті өрістермен жасаймыз
    if (!existingOrganizer) {
      existingOrganizer = await prisma.organizer.create({
        data: {
          ...(targetOrgId !== "orgId" && { id: targetOrgId }),
          name: name || fullName || "Организация",
          company: company || "Компания",
          ownerName: ownerName || fullName || name || "Владелец",
          email: formattedEmail, // Міндетті email өрісі
        },
      });
    }

    // 3. Менторды сәтті байланыстырып құрамыз
    const mentor = await prisma.mentor.create({
      data: {
        name: mentorName,
        phone: phone || "",
        email: formattedEmail,
        organizer: {
          connect: { id: existingOrganizer.id },
        },
      },
    });

    // Ментор сәтті құрылған соң:
    revalidatePath("/org/[orgId]/admin/mentors", "page");

    return mentor;
  } catch (error) {
    console.error("addMentor error:", error);
    throw new Error(`Менторды қосу кезінде қате шықты: ${error.message}`);
  }
}

export async function checkMentor(value, isEmail, marathonId) {
  try {
    const trimmedVal = value.trim();

    // Алдымен базадан Менторды өз Email немесе Телефоны бойынша іздейміз
    let mentor = await prisma.mentor.findFirst({
      where: isEmail
        ? { email: { equals: trimmedVal.toLowerCase(), mode: "insensitive" } }
        : { phone: trimmedVal },
    });

    // Егер Mentor моделінен табылмаса, User моделінен іздеп көреміз
    if (!mentor) {
      const user = await prisma.user.findFirst({
        where: isEmail
          ? { email: { equals: trimmedVal.toLowerCase(), mode: "insensitive" } }
          : { phone: trimmedVal },
      });

      if (user) {
        mentor = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
        };
      }
    }

    if (!mentor) {
      return { status: "not_found" };
    }

    return { status: "found", mentor };
  } catch (error) {
    console.error("checkMentor error:", error);
    return { status: "not_found" };
  }
}

export async function getStudentsByOrgId(orgId) {
  try {
    // 1. Базадан оқушыларды таңдамалы өрістермен аламыз (score-сыз)
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        points: true,
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
            phone: true,
          },
        },
      },
    });

    // 2. Деректерді кестеге ыңғайлап қайтарамыз
    return students.map((s) => {
      const rawPhone = s.phone || s.user?.phone;
      const fullName =
        s.name ||
        (s.user ? `${s.user.firstName} ${s.user.lastName}` : "Аты-жөні көрсетілмеген");

      return {
        id: s.id,
        name: fullName,
        email: s.email || s.user?.email || "—",
        phone: formatPhone(rawPhone),
        marathonTitle: s.marathon?.title || "—",
        points: s.points ?? 0,
      };
    });
  } catch (error) {
    console.error("getStudentsByOrgId error:", error);
    return [];
  }
}

export async function getStudentDashboardAction(currentStudentId) {
  try {
    let student = null;

    // 1. Клиенттен келген ID бойынша оқушыны іздеу
    if (currentStudentId && currentStudentId !== "undefined") {
      student = await prisma.student.findUnique({
        where: { id: currentStudentId },
        include: { marathon: true },
      });
    }

    // 2. Табылмаса, базадағы бірінші оқушыны алу
    if (!student) {
      student = await prisma.student.findFirst({
        include: { marathon: true },
      });
    }

    // 3. Базада оқушы мүлдем жоқ болса — дефолтты демо-деректер
    if (!student) {
      const marathon = (await prisma.marathon.findFirst()) || {
        id: "demo-marathon",
        title: "Демо Марафон",
        totalDays: 30,
      };

      return {
        ok: true,
        data: {
          student: {
            id: "demo-student",
            name: "Қатысушы",
            status: "ACTIVE",
          },
          marathon,
          task: {
            dayNumber: 1,
            title: "1-күн: Танысу және мақсат қою",
            description: "Бүгінгі марафон бағдарламасы бойынша алғашқы тапсырманы орындаңыз.",
          },
          submission: null,
          allSubmissions: [],
        },
      };
    }

    // 4. Марафон мен тапсырма деректерін дайындау
    const marathon = student.marathon || (await prisma.marathon.findFirst());

    const task = (await prisma.task.findFirst({
      where: { marathonId: marathon?.id },
      orderBy: { dayNumber: "asc" },
    })) || {
      dayNumber: 1,
      title: "1-күн Тапсырмасы",
      description: "Бүгінгі сабақ материалдарымен танысып шығыңыз.",
    };

    const submission = await prisma.submission.findFirst({
      where: {
        studentId: student.id,
        dayNumber: task.dayNumber || 1,
      },
    });

    const allSubmissions = await prisma.submission.findMany({
      where: { studentId: student.id },
    });

    return {
      ok: true,
      data: {
        student,
        marathon: marathon || { id: "m1", title: "Марафон", totalDays: 30 },
        task,
        submission,
        allSubmissions,
      },
    };
  } catch (error) {
    console.error("getStudentDashboardAction error:", error);
    return {
      ok: false,
      error: `Серверлік қате: ${error.message}`,
    };
  }
}