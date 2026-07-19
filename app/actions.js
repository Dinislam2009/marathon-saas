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
 * Ағымдағы сессияны анықтайды және рұқсат болмаса бірден қате шығарады.
 */
async function validateSession() {
  const currentUser = await auth.getCurrentUser();
  if (!currentUser) {
    throw new Error("Рұқсат етілмеген сұраныс! Жүйеге қайта кіріңіз.");
  }
  return currentUser;
}

// ==========================================
// --- Мәліметтерді Оқу (Read) Амалдары ---
// ==========================================

export async function fetchInitialState() {
  await validateSession(); // Сессияны тексеру
  
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
  const user = await validateSession();
  
  // Крон немесе дедлайн тексерісін тек Админ немесе Супер Админ ғана іске қоса алуы керек
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Бұл амалды орындауға құқығыңыз жеткіліксіз.");
  }

  await db.checkMissedDeadlines();
  revalidatePath("/");
  return { success: true };
}

export async function getMaterialsForStudentAction(studentId) {
  if (!studentId) return [];
  const user = await validateSession();

  // Қауіпсіздік: Студент тек өзінің материалдарын, ал Админ кез келген студенттікін көре алады
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== studentId) {
    throw new Error("Басқа қатысушының материалдарын көруге рұқсат жоқ.");
  }

  const materials = await db.getMaterialsForStudent(studentId);
  return safeJson(materials);
}

export async function getProfileDataAction(studentId, orgId) {
  try {
    const authUser = await validateSession();

    // Қауіпсіздік сүзгісі
    if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN" && authUser.id !== studentId) {
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

  // Өзгенің ID-і арқылы инспекция жасаудан қорғау
  if (authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN" && authUser.id !== userId) {
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
  const user = await validateSession();
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Жаңа ұйымдастырушыны тек супер админ қоса алады.");
  }

  const res = await db.addOrganizer(fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function setOrganizerSubscriptionStatus(orgId, status) {
  const user = await validateSession();
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("Жазылым статусын тек супер админ басқара алады.");
  }

  await db.setOrganizerSubscriptionStatus(orgId, status);
  revalidatePath("/");
}

export async function createMarathon(orgId, fields) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Марафон құру құқығы тек админде бар.");
  }

  const res = await db.createMarathon(orgId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function upsertTask(marathonId, dayNumber, fields) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Марафон тапсырмаларын тек әкімші өзгерте алады.");
  }

  const res = await db.upsertTask(marathonId, dayNumber, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function setStudentStatus(studentId, status) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Студент статусын өзгертуге рұқсатыңыз жоқ.");
  }

  await db.setStudentStatus(studentId, status);
  revalidatePath("/");
}

export async function updateChecklist(studentId, marathonId, dayNumber, patch) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== studentId) {
    throw new Error("Бұл чеклистті өзгертуге рұқсатыңыз жоқ.");
  }

  const res = await db.updateChecklist(studentId, marathonId, dayNumber, patch);
  revalidatePath("/");
  return safeJson(res);
}

export async function addHabit(studentId, title) {
  const user = await validateSession();
  if (user.id !== studentId) {
    throw new Error("Әдетті тек профиль иесі қоса алады.");
  }

  const res = await db.addHabit(studentId, title);
  revalidatePath("/");
  return safeJson(res);
}

export async function toggleHabitToday(habitId) {
  await validateSession();
  // Ішкі деректер қауіпсіздігі үшін db деңгейінде habit.studentId тексерілуі тиіс
  await db.toggleHabitToday(habitId);
  revalidatePath("/");
}

export async function deleteHabit(habitId) {
  await validateSession();
  await db.deleteHabit(habitId);
  revalidatePath("/");
}

export async function addMatrixTask(studentId, fields) {
  const user = await validateSession();
  if (user.id !== studentId) {
    throw new Error("Эйзенхауэр матрицасын тек профиль иесі басқара алады.");
  }

  const res = await db.addMatrixTask(studentId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function toggleMatrixTaskDone(taskId) {
  await validateSession();
  await db.toggleMatrixTaskDone(taskId);
  revalidatePath("/");
}

export async function deleteMatrixTask(taskId) {
  await validateSession();
  await db.deleteMatrixTask(taskId);
  revalidatePath("/");
}

export async function sendMessage(orgId, studentId, studentName, text) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== studentId) {
    throw new Error("Хабарлама жіберуге рұқсат жоқ.");
  }

  const res = await db.sendMessage(orgId, studentId, studentName, text);
  revalidatePath("/");
  return safeJson(res);
}

export async function addMentor(orgId, fields) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Менторды тек админ қоса алады.");
  }

  const res = await db.addMentor(orgId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function assignMentorToStudent(studentId, mentorId) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Менторды бекіту құқығы сізде жоқ.");
  }

  await db.assignMentorToStudent(studentId, mentorId);
  revalidatePath("/");
}

export async function addInvitation(marathonId, orgId, role, fields) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("Шақыру сілтемесін тек әкімші жасай алады.");
  }

  const res = await db.addInvitation(marathonId, orgId, role, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function addStudentToMarathon(marathonId, fields) {
  await validateSession();
  const res = await db.addStudentToMarathon(marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function addStudentInvitationByMentor(mentorId, marathonId, fields) {
  const user = await validateSession();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== mentorId) {
    throw new Error("Бұл шақыруды жіберуге құқығыңыз жоқ.");
  }

  const res = await db.addStudentInvitationByMentor(mentorId, marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function getOrganizersAction() {
  try {
    const user = await validateSession();
    if (user.role !== "SUPER_ADMIN") {
      throw new Error("Ұйымдастырушылар тізімін тек супер админ көре алады.");
    }

    const organizers = await db.getOrganizers();
    return { ok: true, organizers: safeJson(organizers) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function getStudentDashboardAction(studentId) {
  try {
    const user = await validateSession();
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== studentId) {
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
    const user = await validateSession();
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && user.id !== studentId) {
      throw new Error("Прогресті көруге рұқсатыңыз жоқ.");
    }

    const student = await db.getStudent(studentId);
    const marathon = await db.getMarathonForStudent(studentId);
    const allSubmissions = await db.getSubmissionsByStudent(studentId);

    return {
      ok: true,
      data: safeJson({
        student,
        marathon,
        allSubmissions
      })
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function sendResetOtpAction(identifier) {
  const res = await auth.sendResetOtp(identifier);
  return safeJson(res);
}

export async function resetPasswordWithOtpAction(userId, code, newPassword) {
  const res = await auth.resetPasswordWithOtp({ userId, code, newPassword });
  revalidatePath("/");
  return safeJson(res);
}