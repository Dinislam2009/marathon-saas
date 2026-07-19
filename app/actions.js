"use server";

import * as db from "@/lib/data";
import * as auth from "@/lib/auth";
import { revalidatePath } from "next/cache";

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

// ==========================================
// --- Анықтамалық (Auth) Амалдары --------
// ==========================================

export async function registerUser(fields) {
  const res = await auth.registerUser(fields);
  return safeJson(res);
}

export async function verifyOtp(userId, code) {
  const res = await auth.verifyOtp(userId, code);
  revalidatePath("/");
  return safeJson(res);
}

export async function loginUser(identifier, password) {
  const res = await auth.loginUser(identifier, password);
  return safeJson(res);
}

export async function resendOtp(userId, phone) {
  const res = await auth.resendOtp(userId, phone);
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

export async function getCurrentUser(userId) {
  if (!userId) return null;
  const user = await auth.getUser(userId);
  return safeJson(user);
}

export async function getMaterialsForStudentAction(studentId) {
  if (!studentId) return [];
  const materials = await db.getMaterialsForStudent(studentId);
  return safeJson(materials);
}