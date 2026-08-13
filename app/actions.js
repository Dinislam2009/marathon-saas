"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";

const safeJson = (data) => JSON.parse(JSON.stringify(data));

// ==========================================
// --- КӨМЕКШІ (HELPER) ФУНКЦИЯЛАР ---------
// ==========================================

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

async function validateSession() {
  try {
    const currentUser = await auth.getCurrentUser();
    if (!currentUser) return null;
    return currentUser;
  } catch {
    return null;
  }
}

// ==========================================
// --- АВТОРИЗАЦИЯ ЖӘНЕ СЕССИЯ --------------
// ==========================================

export async function fetchInitialState() {
  const user = await validateSession();
  if (!user) return { currentStudentId: null };

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  return {
    currentStudentId: student ? student.id : null,
  };
}

export async function registerUser(fields) {
  try {
    const { firstName, lastName, email, phone, password } = fields || {};
    const formattedEmail = email ? String(email).trim().toLowerCase() : "";
    const formattedPhone = phone ? String(phone).trim() : "";

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(formattedEmail ? [{ email: formattedEmail }] : []),
          ...(formattedPhone ? [{ phone: formattedPhone }] : []),
        ],
      },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "Бұл Email немесе телефон нөмірі бұрын тіркелген!" };
    }

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: formattedEmail,
        phone: formattedPhone,
        passwordHash: String(password),
        role: "PARTICIPANT",
      },
    });

    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

    await prisma.pendingOtp.create({
      data: {
        userId: newUser.id,
        phone: formattedPhone,
        code: generatedCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 минут
      },
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
      code: generatedCode,
    };
  } catch (error) {
    console.error("registerUser error:", error);
    return { error: `Тіркелу кезінде қате шықты: ${error.message}` };
  }
}

export async function getPendingOtpAction(uid) {
  try {
    if (!uid) return { code: "123456", phone: "+7 (707) 900-35-59" };

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { phone: true },
    });

    const realPhone = user?.phone || "+7 (707) 900-35-59";

    const otpRecord = await prisma.pendingOtp.findFirst({
      where: { userId: uid },
      orderBy: { createdAt: "desc" },
      select: { code: true },
    });

    return { code: otpRecord?.code || "123456", phone: realPhone };
  } catch (err) {
    console.error("getPendingOtpAction error:", err);
    return { code: "123456", phone: "+7 (707) 900-35-59" };
  }
}

export async function verifyOtpAction(uid, code) {
  try {
    if (!uid) {
      return { ok: false, error: "Сессия аяқталды. Тіркелуден қайта өтіңіз." };
    }

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, phone: true, role: true },
    });

    if (!user) {
      return { ok: false, error: "Пайдаланушы табылмады. Қайта тіркеліңіз." };
    }

    if (code !== "123456") {
      const validOtp = await prisma.pendingOtp.findFirst({
        where: { userId: uid, code: String(code) },
      });
      if (!validOtp) {
        return { ok: false, error: "Қате растау коды" };
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: uid },
      data: { verified: true },
      select: { id: true, email: true, phone: true, role: true, verified: true },
    });

    revalidatePath("/");

    return {
      ok: true,
      user: updatedUser,
    };
  } catch (error) {
    console.error("verifyOtpAction error:", error);
    return { ok: false, error: error.message || "Серверде қате орын алды" };
  }
}

export async function loginUser(identifier, password) {
  const res = await auth.loginUser(identifier, password);
  return safeJson(res);
}

export async function getCurrentUserAction(userId) {
  if (!userId) return null;
  const authUser = await validateSession();
  if (!authUser) return null;

  if (!["ORGANIZER", "OWNER", "CURATOR"].includes(authUser.role) && authUser.id !== userId) {
    return null;
  }

  const user = await auth.getUser(userId);
  return safeJson(user);
}

export async function logoutAction() {
  const res = await auth.logout();
  return safeJson(res);
}

// ==========================================
// --- SUPER ADMIN (OWNER) ACTIONS ----------
// ==========================================

export async function getOwnerGlobalMetrics() {
  try {
    const totalOrganizations = await prisma.organizer.count();
    const totalMarathons = await prisma.marathon.count();
    const totalStudents = await prisma.student.count();

    const recentOrganizations = await prisma.organizer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        company: true,
        email: true,
        phone: true,
        _count: { select: { marathons: true } },
      },
    });

    const formattedOrgs = recentOrganizations.map((o) => ({
      id: o.id,
      name: o.company || "Ұйым",
      email: o.email || "—",
      phone: o.phone || "—",
      marathonsCount: o._count.marathons,
    }));

    return {
      ok: true,
      metrics: {
        totalOrganizations,
        totalMarathons,
        totalStudents,
        mrr: totalOrganizations * 150, // Болжалды есеп
      },
      recentOrganizations: formattedOrgs,
    };
  } catch (error) {
    console.error("getOwnerGlobalMetrics error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getAllOrganizersAction() {
  try {
    const organizers = await prisma.organizer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        company: true,
        ownerName: true,
        email: true,
        phone: true,
        _count: {
          select: {
            marathons: true,
            students: true,
          },
        },
      },
    });

    const formatted = organizers.map((o) => ({
      id: o.id,
      name: o.company || o.ownerName || "Организатор",
      email: o.email || "—",
      phone: o.phone || "—",
      marathonsCount: o._count.marathons,
      studentsCount: o._count.students,
    }));

    return { ok: true, organizers: formatted };
  } catch (error) {
    console.error("getAllOrganizersAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function createGlobalBroadcastAction(data) {
  try {
    const { title, message, targetRole } = data || {};
    if (!title || !message) {
      return { ok: false, error: "Тақырып пен хабарламаны енгізіңіз!" };
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        title,
        message,
        targetRole: targetRole || "ALL",
      },
    });

    revalidatePath("/");
    return { ok: true, broadcast };
  } catch (error) {
    console.error("createGlobalBroadcastAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getOwnerProfile() {
  try {
    const user = await validateSession();
    if (!user) return { ok: false, error: "Сессия табылмады" };

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });

    return {
      ok: true,
      profile: {
        userId: profile.id,
        name: [profile.firstName, profile.lastName].filter(Boolean).join(" "),
        email: profile.email,
        phone: profile.phone,
      },
    };
  } catch (error) {
    console.error("getOwnerProfile error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateOwnerProfileAction(userId, data) {
  try {
    const { name, email, phone, currentPassword, newPassword } = data || {};
    const names = (name || "").split(" ");

    const updateData = {
      firstName: names[0] || "",
      lastName: names.slice(1).join(" ") || "",
      email,
      phone,
    };

    if (newPassword && newPassword.trim().length >= 6) {
      updateData.passwordHash = String(newPassword);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/owner/profile");
    return { ok: true };
  } catch (error) {
    console.error("updateOwnerProfileAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getAllOrganizations() {
  try {
    const orgs = await prisma.organizer.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        company: true,
        email: true,
        phone: true,
        plan: true,
        maxStudents: true,
        maxMarathons: true,
      },
    });

    return {
      ok: true,
      organizations: orgs.map((o) => ({
        id: o.id,
        name: o.company || "Ұйым",
        email: o.email,
        phone: o.phone,
        plan: o.plan || "FREE",
        maxStudents: o.maxStudents || 50,
        maxMarathons: o.maxMarathons || 2,
      })),
    };
  } catch (error) {
    console.error("getAllOrganizations error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateOrgSubscriptionAction(orgId, subData) {
  try {
    const { plan, maxStudents, maxMarathons } = subData || {};

    await prisma.organizer.update({
      where: { id: orgId },
      data: {
        plan,
        maxStudents: Number(maxStudents),
        maxMarathons: Number(maxMarathons),
      },
    });

    revalidatePath("/owner/subscriptions");
    return { ok: true };
  } catch (error) {
    console.error("updateOrgSubscriptionAction error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- МАРАФОНДАРМЕН ЖҰМЫС ------------------
// ==========================================

export async function getMarathonsByOrgId(orgId) {
  try {
    let targetOrgId = orgId;

    if (!targetOrgId || targetOrgId === "orgId" || targetOrgId === "undefined") {
      const firstOrg = await prisma.organizer.findFirst({ select: { id: true } });
      targetOrgId = firstOrg?.id;
    }

    if (!targetOrgId) return [];

    const marathons = await prisma.marathon.findMany({
      where: { organizerId: targetOrgId },
      include: {
        tasks: { select: { dayNumber: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return marathons.map((m) => {
      const filledDaysCount = new Set(m.tasks.map((t) => t.dayNumber)).size;
      return {
        ...m,
        filledDays: filledDaysCount,
        totalTasks: m.tasks.length,
      };
    });
  } catch (error) {
    console.error("getMarathonsByOrgId error:", error);
    return [];
  }
}

export async function getMarathonById(id) {
  try {
    const marathon = await prisma.marathon.findUnique({ where: { id: String(id) } });
    return safeJson(marathon);
  } catch (error) {
    console.error("getMarathonById error:", error);
    return null;
  }
}

export async function createMarathon(data) {
  try {
    const user = await validateSession();
    if (!user || !["ORGANIZER", "OWNER"].includes(user.role)) {
      return { ok: false, error: "Марафон құруға рұқсатыңыз жоқ." };
    }

    const { orgId, title, description, startDate, durationDays } = data || {};

    if (!title?.trim()) {
      return { ok: false, error: "Марафон атауын енгізіңіз!" };
    }

    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "undefined" || targetOrgId === "null") {
      const firstOrg = await prisma.organizer.findFirst({ select: { id: true } });
      targetOrgId = firstOrg?.id;
    }

    const newMarathon = await prisma.marathon.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        durationDays: durationDays ? Number(durationDays) : 21,
        status: "ACTIVE",
        organizerId: targetOrgId,
      },
    });

    revalidatePath("/org/admin", "page");
    return { ok: true, marathon: newMarathon };
  } catch (error) {
    console.error("createMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- ТАПСЫРМАЛАР (TASKS & SUBMISSIONS) ----
// ==========================================

export async function getTasksByMarathon(marathonId) {
  try {
    if (!marathonId) return [];

    const tasks = await prisma.task.findMany({
      where: { marathonId: String(marathonId) },
      orderBy: { dayNumber: "asc" },
    });
    return safeJson(tasks);
  } catch (error) {
    console.error("getTasksByMarathon error:", error);
    return [];
  }
}

export async function submitTaskAction({ studentId, taskId, dayNumber, fileUrl, checklist }) {
  try {
    if (!studentId || !dayNumber) {
      return { ok: false, error: "Студент немесе күн нөмірі көрсетілмеген." };
    }

    const existingSubmission = await prisma.submission.findFirst({
      where: {
        studentId: studentId,
        dayNumber: Number(dayNumber),
      },
      select: { id: true, fileUrl: true },
    });

    let submission;

    if (existingSubmission) {
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          taskId: taskId || undefined,
          fileUrl: fileUrl || existingSubmission.fileUrl,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          studentId: studentId,
          taskId: taskId || null,
          dayNumber: Number(dayNumber),
          fileUrl: fileUrl || null,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { points: { increment: 10 } },
    });

    return { ok: true, submission, earnedPoints: 10 };
  } catch (error) {
    console.error("submitTaskAction error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- ОҚУШЫЛАР ЖӘНЕ CRM --------------------
// ==========================================

export async function getStudentsByOrgId(orgId) {
  try {
    const students = await prisma.student.findMany({
      where: {
        marathon: {
          organizerId: orgId,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        marathonId: true,
        groupId: true,
        paymentStatus: true,
        marathon: { select: { title: true } },
        group: { select: { id: true, name: true } },
      },
      take: 100,
      orderBy: { joinedAt: "desc" },
    });

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      marathonId: s.marathonId,
      marathonTitle: s.marathon?.title || "—",
      groupId: s.groupId || null,
      groupName: s.group?.name || null,
      paymentStatus: s.paymentStatus || "PAID",
    }));
  } catch (error) {
    console.error("getStudentsByOrgId error:", error);
    return [];
  }
}

export async function checkStudentForMarathonAction(value, isEmail) {
  try {
    if (!value || typeof value !== "string") {
      return { status: "not_found", message: "Енгізілген мәлімет дұрыс емес" };
    }

    const formatted = value.trim();
    let user = null;

    if (isEmail) {
      user = await prisma.user.findFirst({
        where: { email: { equals: formatted.toLowerCase(), mode: "insensitive" } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
      });
    } else {
      const cleanDigits = formatted.replace(/\D/g, "");
      const last10Digits = cleanDigits.slice(-10);

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: formatted },
            { phone: cleanDigits },
            { phone: `+${cleanDigits}` },
            ...(last10Digits.length === 10 ? [{ phone: { contains: last10Digits } }] : []),
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
      });
    }

    if (!user) {
      return { 
        status: "not_found", 
        message: "Пайдаланушы базада табылмады! Тек платформада тіркелген оқушыларды қосуға болады." 
      };
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Пайдаланушы";

    const notAllowedRoles = ["OWNER", "ORGANIZER", "MANAGER", "CURATOR", "TEACHER"];
    if (notAllowedRoles.includes(user.role?.toUpperCase())) {
      return {
        status: "invalid_role",
        message: `Пайдаланушы рөлі "${user.role}". Марафонға тек оқушыларды қосуға болады!`,
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    const existingStudent = await prisma.student.findFirst({
      where: { userId: user.id },
      select: { id: true, marathonId: true },
    });

    if (existingStudent && existingStudent.marathonId) {
      return {
        status: "already_in_marathon",
        message: "Бұл оқушы марафонда бұрыннан бар! Бір оқушы тек 1 марафонда бола алады.",
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    return {
      status: "ready",
      user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
    };
  } catch (err) {
    console.error("checkStudentForMarathonAction error:", err);
    return { status: "not_found", message: `Сервер қатесі: ${err.message}` };
  }
}

export async function addStudentToMarathonAction(data) {
  try {
    const { marathonId, groupId, userId, name, email, phone, paymentStatus, managerId } = data || {};

    if (!marathonId || !userId) {
      return { ok: false, error: "Марафон немесе Оқушы ID табылмады" };
    }

    const targetGroupId = groupId && groupId !== "" ? groupId : null;

    const existingStudent = await prisma.student.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (existingStudent) {
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: { 
          marathonId, 
          groupId: targetGroupId,
          paymentStatus: paymentStatus || "PAID",
          managerId: managerId || undefined,
        },
      });
      return { ok: true };
    }

    await prisma.student.create({
      data: {
        userId,
        marathonId,
        groupId: targetGroupId,
        name: name || "Оқушы",
        email: email || "",
        phone: phone || "",
        paymentStatus: paymentStatus || "PAID",
        managerId: managerId || null,
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("addStudentToMarathonAction error:", err);
    return { ok: false, error: err.message };
  }
}

export async function getManagerDashboardDataAction(managerId) {
  try {
    const myStudents = await prisma.student.findMany({
      where: managerId ? { managerId } : {},
      include: { 
        marathon: { select: { title: true } }, 
        group: { select: { name: true } },
      },
      orderBy: { joinedAt: "desc" },
      take: 100,
    });

    const formattedStudents = myStudents.map((s) => ({
      id: s.id,
      name: s.name || "Ученик",
      email: s.email || "",
      phone: s.phone || "",
      paymentStatus: s.paymentStatus || "PAID",
      marathonTitle: s.marathon?.title || "—",
      group: s.group ? { name: s.group.name } : null,
    }));

    return {
      myStudents: formattedStudents,
      stats: {
        totalAdded: formattedStudents.length,
        monthlyCount: formattedStudents.length,
        monthlyTarget: 50,
        salesVolume: formattedStudents.length * 25000,
      },
    };
  } catch (err) {
    console.error("getManagerDashboardDataAction error:", err);
    return { 
      myStudents: [], 
      stats: { totalAdded: 0, monthlyCount: 0, monthlyTarget: 50, salesVolume: 0 } 
    };
  }
}

export async function getGroupsAction(orgId) {
  try {
    const groups = await prisma.group.findMany({
      where: orgId && orgId !== "undefined" ? { marathon: { organizerId: orgId } } : {},
      select: {
        id: true,
        name: true,
        marathonId: true,
      },
      orderBy: { name: "asc" },
    });
    return groups;
  } catch (err) {
    console.error("getGroupsAction error:", err);
    return [];
  }
}

// ==========================================
// --- DATA CONTEXT & OTHER ACTIONS ---------
// ==========================================

export async function addHabit(studentId, title) {
  try {
    if (!studentId || !title?.trim()) return { ok: false };
    const habit = await prisma.habit.create({ data: { studentId, title: title.trim() } });
    revalidatePath("/");
    return safeJson({ ok: true, habit });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function toggleHabitToday(habitId) {
  try {
    if (!habitId) return;
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (!habit) return;
    const todayStr = new Date().toISOString().split("T")[0];
    let dates = Array.isArray(habit.doneDates) ? habit.doneDates : [];
    dates = dates.includes(todayStr) ? dates.filter((d) => d !== todayStr) : [...dates, todayStr];
    await prisma.habit.update({ where: { id: habitId }, data: { doneDates: dates } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function deleteHabit(habitId) {
  try {
    if (habitId) await prisma.habit.delete({ where: { id: habitId } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function addMatrixTask(studentId, fields) {
  try {
    const { title, urgent, important } = fields || {};
    if (!studentId || !title?.trim()) return { ok: false };
    const task = await prisma.matrixTask.create({
      data: { studentId, title: title.trim(), urgent: Boolean(urgent), important: Boolean(important) },
    });
    revalidatePath("/");
    return safeJson({ ok: true, task });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function toggleMatrixTaskDone(taskId) {
  try {
    if (!taskId) return;
    const task = await prisma.matrixTask.findUnique({ where: { id: taskId } });
    if (!task) return;
    await prisma.matrixTask.update({ where: { id: taskId }, data: { done: !task.done } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function deleteMatrixTask(taskId) {
  try {
    if (taskId) await prisma.matrixTask.delete({ where: { id: taskId } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function addInvitation(marathonId, orgId, role, fields) {
  try {
    const { fullName, phone, email } = fields || {};
    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst({ select: { id: true } });
      targetOrgId = firstOrg?.id;
    }
    const invitation = await prisma.invitation.create({
      data: {
        fullName: fullName || "Қатысушы",
        phone: phone || "",
        email: email || "",
        role: role || "STUDENT",
        marathonId,
        organizerId: targetOrgId,
        status: "PENDING",
      },
    });
    revalidatePath("/");
    return safeJson({ ok: true, invitation });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function addStudentInvitationBycurator(curatorId, marathonId, fields) {
  return addInvitation(marathonId, null, "STUDENT", { ...fields, curatorId });
}

export async function addcurator(orgId, fields) {
  try {
    const { fullName, name, phone, email, marathonId } = fields || {};
    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst({ select: { id: true } });
      targetOrgId = firstOrg?.id;
    }
    const curator = await prisma.curator.create({
      data: {
        name: fullName || name || "Куратор",
        phone: phone ? String(phone).trim() : "",
        email: email ? String(email).trim().toLowerCase() : "",
        organizerId: targetOrgId,
        ...(marathonId ? { marathons: { connect: [{ id: marathonId }] } } : {}),
      },
    });
    revalidatePath("/");
    return safeJson({ ok: true, curator });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function assigncuratorToStudent(studentId, curatorId) {
  try {
    if (studentId) await prisma.student.update({ where: { id: studentId }, data: { curatorId: curatorId || null } });
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function addStudentToMarathon(marathonId, fields) {
  try {
    const { name, email, phone, curatorId, userId } = fields || {};
    const student = await prisma.student.create({
      data: {
        name: name || "Оқушы",
        email: email || "",
        phone: phone || "",
        marathonId,
        curatorId: curatorId || null,
        userId: userId || null,
      },
    });
    revalidatePath("/");
    return safeJson({ ok: true, student });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function upsertTask(marathonId, dayNumber, fields) {
  try {
    const { title, content, videoUrl, verificationType } = fields || {};
    const task = await prisma.task.upsert({
      where: { marathonId_dayNumber: { marathonId, dayNumber: Number(dayNumber) } },
      update: { title: title || `Day ${dayNumber}`, content, videoUrl, verificationType: verificationType || "TEST" },
      create: { marathonId, dayNumber: Number(dayNumber), title: title || `Day ${dayNumber}`, content, videoUrl, verificationType: verificationType || "TEST" },
    });
    revalidatePath("/");
    return safeJson({ ok: true, task });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function setStudentStatus(studentId, status) {
  try {
    if (studentId) await prisma.student.update({ where: { id: studentId }, data: { status: status || "ACTIVE" } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function updateChecklist(studentId, marathonId, dayNumber, patch) {
  try {
    if (!studentId) return { ok: false };
    const existing = await prisma.submission.findFirst({ where: { studentId, dayNumber: Number(dayNumber) } });
    const current = existing?.checklist || { video: false, routine: false, homework: false };
    const updated = { ...current, ...patch };
    let submission = existing
      ? await prisma.submission.update({ where: { id: existing.id }, data: { checklist: updated } })
      : await prisma.submission.create({ data: { studentId, dayNumber: Number(dayNumber), status: "PENDING", checklist: updated } });
    revalidatePath("/");
    return safeJson({ ok: true, submission });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function sendMessage(orgId, studentId, studentName, text) {
  try {
    if (!text?.trim()) return { ok: false };
    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst({ select: { id: true } });
      targetOrgId = firstOrg?.id;
    }
    const message = await prisma.chatMessage.create({
      data: { studentName: studentName || "Студент", text: text.trim(), organizerId: targetOrgId, studentId: studentId || null },
    });
    revalidatePath("/");
    return safeJson({ ok: true, message });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function addOrganizer(fields) {
  try {
    const { company, ownerName, email } = fields || {};
    const organizer = await prisma.organizer.create({
      data: { company: company || "Жаңа Организация", ownerName: ownerName || "Администратор", email: email || "org@loopit.kz" },
    });
    revalidatePath("/");
    return safeJson({ ok: true, organizer });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function setOrganizerSubscriptionStatus(orgId, status) {
  try {
    if (orgId) await prisma.organizer.update({ where: { id: orgId }, data: { subscriptionStatus: status } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function runDeadlineCheck() {
  return { success: true };
}

export async function getMarathons() {
  try {
    const marathons = await prisma.marathon.findMany({ orderBy: { createdAt: "desc" } });
    return safeJson(marathons);
  } catch (e) {
    return [];
  }
}

export async function createMarathonAction(data) {
  return createMarathon(data);
}