"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/data";
import * as auth from "@/lib/auth";

// Күрделі Prisma объектілерін Server Action шекарасынан қауіпсіз өткізуге арналған көмекші функция
function safeJson(data) {
  if (data === undefined || data === null) return null;
  return JSON.parse(JSON.stringify(data));
}

// ==========================================
// --- Мәліметтерді Оқу (Read) Амалдары ---
// ==========================================

export async function fetchInitialState() {
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
  await db.checkMissedDeadlines();
  revalidatePath("/");
  return { success: true };
}

export async function getMaterialsForStudentAction(studentId) {
  if (!studentId) return [];
  const materials = await db.getMaterialsForStudent(studentId);
  return safeJson(materials);
}

export async function getProfileDataAction(studentId, orgId) {
  try {
    const student = await db.getStudent(studentId);
    const marathon = await db.getMarathonForStudent(studentId);
    const authUser = await auth.getCurrentUser(); // Немесе ішкі auth.getUser() логикасы бойынша
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
  const user = await auth.getUser(userId);
  return safeJson(user);
}

// --- OTP растау құралдары ---
export async function verifyOtpAction(uid, code) {
  const res = await auth.verifyOtp(uid, code);
  revalidatePath("/");
  return safeJson(res);
}

export async function resendOtpAction(uid, phone) {
  const res = await auth.resendOtp(uid, phone);
  return safeJson(res);
}

export async function getPendingOtpAction() {
  const res = await auth.getPendingOtp();
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
  const res = await db.addOrganizer(fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function setOrganizerSubscriptionStatus(orgId, status) {
  await db.setOrganizerSubscriptionStatus(orgId, status);
  revalidatePath("/");
}

export async function createMarathon(orgId, fields) {
  const res = await db.createMarathon(orgId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function upsertTask(marathonId, dayNumber, fields) {
  const res = await db.upsertTask(marathonId, dayNumber, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function setStudentStatus(studentId, status) {
  await db.setStudentStatus(studentId, status);
  revalidatePath("/");
}

export async function updateChecklist(studentId, marathonId, dayNumber, patch) {
  const res = await db.updateChecklist(studentId, marathonId, dayNumber, patch);
  revalidatePath("/");
  return safeJson(res);
}

export async function addHabit(studentId, title) {
  const res = await db.addHabit(studentId, title);
  revalidatePath("/");
  return safeJson(res);
}

export async function toggleHabitToday(habitId) {
  await db.toggleHabitToday(habitId);
  revalidatePath("/");
}

export async function deleteHabit(habitId) {
  await db.deleteHabit(habitId);
  revalidatePath("/");
}

export async function addMatrixTask(studentId, fields) {
  const res = await db.addMatrixTask(studentId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function toggleMatrixTaskDone(taskId) {
  await db.toggleMatrixTaskDone(taskId);
  revalidatePath("/");
}

export async function deleteMatrixTask(taskId) {
  await db.deleteMatrixTask(taskId);
  revalidatePath("/");
}

export async function sendMessage(orgId, studentId, studentName, text) {
  const res = await db.sendMessage(orgId, studentId, studentName, text);
  revalidatePath("/");
  return safeJson(res);
}

export async function addMentor(orgId, fields) {
  const res = await db.addMentor(orgId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function assignMentorToStudent(studentId, mentorId) {
  await db.assignMentorToStudent(studentId, mentorId);
  revalidatePath("/");
}

export async function addInvitation(marathonId, orgId, role, fields) {
  const res = await db.addInvitation(marathonId, orgId, role, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function addStudentToMarathon(marathonId, fields) {
  const res = await db.addStudentToMarathon(marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function addStudentInvitationByMentor(mentorId, marathonId, fields) {
  const res = await db.addStudentInvitationByMentor(mentorId, marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
}