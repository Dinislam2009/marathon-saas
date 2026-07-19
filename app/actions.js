"use server";

import * as db from "@/lib/data";
import * as auth from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
  return { success: true };
}

// ==========================================
// --- Анықтамалық (Auth) Амалдары --------
// ==========================================

export async function registerUserAction(fields) {
  const res = await auth.registerUser(fields);
  return JSON.parse(JSON.stringify(res));
}

export async function verifyOtpAction(userId, code) {
  const res = await auth.verifyOtp(userId, code);
  return JSON.parse(JSON.stringify(res));
}

export async function loginUserAction(identifier, password) {
  const res = await auth.loginUser(identifier, password);
  return JSON.parse(JSON.stringify(res));
}

export async function resendOtpAction(userId, phone) {
  const res = await auth.resendOtp(userId, phone);
  return JSON.parse(JSON.stringify(res));
}

// ==========================================
// --- Өзгерту (Mutation) Амалдары ---------
// ==========================================

export async function addOrganizerAction(fields) {
  const res = await db.addOrganizer(fields);
  return JSON.parse(JSON.stringify(res));
}

export async function setOrganizerSubscriptionStatusAction(orgId, status) {
  await db.setOrganizerSubscriptionStatus(orgId, status);
  revalidatePath("/");
}

export async function createMarathonAction(orgId, fields) {
  const res = await db.createMarathon(orgId, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function upsertTaskAction(marathonId, dayNumber, fields) {
  const res = await db.upsertTask(marathonId, dayNumber, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function setStudentStatusAction(studentId, status) {
  await db.setStudentStatus(studentId, status);
  revalidatePath("/");
}

export async function updateChecklistAction(studentId, marathonId, dayNumber, patch) {
  const res = await db.updateChecklist(studentId, marathonId, dayNumber, patch);
  return JSON.parse(JSON.stringify(res));
}

export async function addHabitAction(studentId, title) {
  const res = await db.addHabit(studentId, title);
  return JSON.parse(JSON.stringify(res));
}

export async function toggleHabitTodayAction(habitId) {
  await db.toggleHabitToday(habitId);
  revalidatePath("/");
}

export async function deleteHabitAction(habitId) {
  await db.deleteHabit(habitId);
  revalidatePath("/");
}

export async function addMatrixTaskAction(studentId, fields) {
  const res = await db.addMatrixTask(studentId, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function toggleMatrixTaskDoneAction(taskId) {
  await db.toggleMatrixTaskDone(taskId);
  revalidatePath("/");
}

export async function deleteMatrixTaskAction(taskId) {
  await db.deleteMatrixTask(taskId);
  revalidatePath("/");
}

export async function sendMessageAction(orgId, studentId, studentName, text) {
  const res = await db.sendMessage(orgId, studentId, studentName, text);
  return JSON.parse(JSON.stringify(res));
}

export async function addMentorAction(orgId, fields) {
  const res = await db.addMentor(orgId, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function assignMentorToStudentAction(studentId, mentorId) {
  await db.assignMentorToStudent(studentId, mentorId);
  revalidatePath("/");
}

export async function addInvitationAction(marathonId, orgId, role, fields) {
  const res = await db.addInvitation(marathonId, orgId, role, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function addStudentToMarathonAction(marathonId, fields) {
  const res = await db.addStudentToMarathon(marathonId, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function addStudentInvitationByMentorAction(mentorId, marathonId, fields) {
  const res = await db.addStudentInvitationByMentor(mentorId, marathonId, fields);
  return JSON.parse(JSON.stringify(res));
}

export async function getCurrentUserAction(userId) {
  if (!userId) return null;
  const user = await auth.getUser(userId);
  return JSON.parse(JSON.stringify(user));
}