"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/data"; 
import * as auth from "@/lib/auth";
import { getTodayDayNumber } from "@/lib/utils"; 

// Helper function to stringify complex DB objects safely across the server boundary
function safeJson(data) {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
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
  const user = await validateSession(); // Сессияны тексеру
  
  // Егер қолданушы авторизациядан өтпеген болса, бос штат қайтару
  if (!user) {
    return { currentStudentId: null };
  }

  const organizers = await db.getOrganizers();
  const org = organizers[0] || null;
  let marathon = null;
  let firstStudent = null;

  if (org) {
    const marathons = await db.getMarathonsByOrg(org.id);
    marathon = marathons[0] || null;
  }
  if (marathon) {
    const students = await db.getStudentsByMarathon(marathon.id);
    firstStudent = students[0] || null;
  }

  return {
    currentStudentId: firstStudent ? firstStudent.id : null
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
    return { ok: false, error: error.message };
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
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER")) {
    throw new Error("Марафон құру құқығы тек ұйымдастырушыда бар.");
  }

  const res = await db.createMarathon(orgId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function upsertTask(marathonId, dayNumber, fields) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER")) {
    throw new Error("Марафон тапсырмаларын тек ұйымдастырушы өзгерте алады.");
  }

  const res = await db.upsertTask(marathonId, dayNumber, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function setStudentStatus(studentId, status) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR")) {
    throw new Error("Студент статусын өзгертуге рұқсатыңыз жоқ.");
  }

  await db.setStudentStatus(studentId, status);
  revalidatePath("/");
}

export async function updateChecklist(studentId, marathonId, dayNumber, patch) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR" && user.id !== studentId)) {
    throw new Error("Бұл чеклистті өзгертуге рұқсатыңыз жоқ.");
  }

  const res = await db.updateChecklist(studentId, marathonId, dayNumber, patch);
  revalidatePath("/");
  return safeJson(res);
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

export async function addMentor(orgId, fields) {
  const user = await validateSession();
  if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER")) {
    throw new Error("Менторды тек ұйымдастырушы қоса алады.");
  }

  const res = await db.addMentor(orgId, fields);
  revalidatePath("/");
  return safeJson(res);
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
  const user = await validateSession();
  if (!user) return null;
  const res = await db.addStudentToMarathon(marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
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

export async function getStudentDashboardAction(studentId) {
  try {
    const user = await validateSession();
    if (!user || (user.role !== "ORGANIZER" && user.role !== "OWNER" && user.role !== "CURATOR" && user.id !== studentId)) {
      throw new Error("Бақылау панелін көруге рұқсатыңыз жоқ.");
    }

    const student = await db.getStudent(studentId);
    const marathon = await db.getMarathonForStudent(studentId);
    
    if (!student || !marathon) {
      return { ok: false, error: "Деректер табылмады" };
    }

    const todayDay = getTodayDayNumber(marathon) || 1;
    
    const task = await db.getTask(marathon.id, todayDay);
    const submission = await db.getSubmission(student.id, todayDay);
    const allSubmissions = await db.getSubmissionsByStudent(student.id);

    return {
      ok: true,
      data: safeJson({
        student,
        marathon,
        task,
        submission,
        allSubmissions
      })
    };
  } catch (error) {
    return { ok: false, error: error.message };
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