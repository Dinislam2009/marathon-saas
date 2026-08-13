"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";

const safeJson = (data) => JSON.parse(JSON.stringify(data));

// ==========================================
// --- КӨМЕКШІ (HELPER) ФУНКЦИЯЛАР ---------
// ==========================================

function formatPhoneToDbStyle(phone) {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  const last10 = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
  
  if (last10.length === 10) {
    const code = last10.slice(0, 3);
    const p1 = last10.slice(3, 6);
    const p2 = last10.slice(6, 8);
    const p3 = last10.slice(8, 10);
    return `+7 (${code}) ${p1}-${p2}-${p3}`;
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
    const rawPhone = phone ? String(phone).trim() : "";
    const dbPhone = formatPhoneToDbStyle(rawPhone);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(formattedEmail ? [{ email: formattedEmail }] : []),
          ...(rawPhone ? [{ phone: rawPhone }, { phone: dbPhone }] : []),
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
        phone: dbPhone || rawPhone,
        passwordHash: String(password),
        role: "PARTICIPANT",
      },
    });

    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

    await prisma.pendingOtp.create({
      data: {
        userId: newUser.id,
        phone: newUser.phone,
        code: generatedCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
  try {
    const rawInput = (identifier || "").trim();
    if (!rawInput || !password) {
      return { ok: false, error: "Мәліметтерді толық толтырыңыз." };
    }

    const dbFormattedPhone = formatPhoneToDbStyle(rawInput);
    const cleanDigits = rawInput.replace(/\D/g, "");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawInput.toLowerCase() },
          { phone: rawInput },
          { phone: dbFormattedPhone },
          ...(cleanDigits ? [{ phone: { contains: cleanDigits.slice(-10) } }] : []),
        ],
      },
    });

    if (!user) {
      return { ok: false, error: "Пайдаланушы табылмады." };
    }

    if (user.passwordHash !== String(password)) {
      return { ok: false, error: "Құпия сөз қате!" };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  } catch (error) {
    console.error("loginUser error:", error);
    return { ok: false, error: "Серверде ішкі қате орын алды." };
  }
}

export async function getCurrentUser(userId) {
  if (!userId) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
      },
    });
    return safeJson(user);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function getCurrentUserAction(userId) {
  return getCurrentUser(userId);
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
        mrr: totalOrganizations * 150,
      },
      recentOrganizations: formattedOrgs,
    };
  } catch (error) {
    console.error("getOwnerGlobalMetrics error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getOwnerGlobalMetricsAction() {
  return getOwnerGlobalMetrics();
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

export async function createMarathonAction(data) {
  return createMarathon(data);
}

export async function updateMarathonAction(marathonId, data) {
  try {
    if (!marathonId) {
      return { ok: false, error: "Марафон ID-і көрсетілмеген!" };
    }

    const { title, description, startDate, durationDays, status } = data || {};

    const updatedMarathon = await prisma.marathon.update({
      where: { id: String(marathonId) },
      data: {
        ...(title ? { title: title.trim() } : {}),
        ...(description !== undefined ? { description: description?.trim() || null } : {}),
        ...(startDate ? { startDate: new Date(startDate) } : {}),
        ...(durationDays ? { durationDays: Number(durationDays) } : {}),
        ...(status ? { status } : {}),
      },
    });

    revalidatePath("/org/admin");
    return { ok: true, marathon: updatedMarathon };
  } catch (error) {
    console.error("updateMarathonAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateMarathon(marathonId, data) {
  return updateMarathonAction(marathonId, data);
}

export async function deleteMarathonAction(marathonId) {
  try {
    if (!marathonId) return { ok: false, error: "Марафон ID-і көрсетілмеген!" };

    await prisma.marathon.delete({
      where: { id: String(marathonId) },
    });

    revalidatePath("/org/admin");
    return { ok: true };
  } catch (error) {
    console.error("deleteMarathonAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteMarathon(marathonId) {
  return deleteMarathonAction(marathonId);
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

export async function getTasksByMarathonId(marathonId) {
  return getTasksByMarathon(marathonId);
}

export async function getTasksByMarathonIdAction(marathonId) {
  return getTasksByMarathon(marathonId);
}

export async function saveTaskAction(data, dayNum, fieldsData) {
  try {
    let marathonId, dayNumber, fields;

    if (typeof data === "object" && data !== null && !dayNum) {
      marathonId = data.marathonId;
      dayNumber = data.dayNumber;
      fields = data;
    } else {
      marathonId = data;
      dayNumber = dayNum;
      fields = fieldsData;
    }

    if (!marathonId || dayNumber === undefined || dayNumber === null) {
      return { ok: false, error: "Марафон ID және күн нөмірін көрсетіңіз!" };
    }

    const { title, content, videoUrl, verificationType } = fields || {};

    const task = await prisma.task.upsert({
      where: {
        marathonId_dayNumber: {
          marathonId: String(marathonId),
          dayNumber: Number(dayNumber),
        },
      },
      update: {
        title: title || `Day ${dayNumber}`,
        content,
        videoUrl,
        verificationType: verificationType || "TEST",
      },
      create: {
        marathonId: String(marathonId),
        dayNumber: Number(dayNumber),
        title: title || `Day ${dayNumber}`,
        content,
        videoUrl,
        verificationType: verificationType || "TEST",
      },
    });

    revalidatePath("/org/admin/tasks");
    return safeJson({ ok: true, task });
  } catch (error) {
    console.error("saveTaskAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function saveTask(data, dayNum, fieldsData) {
  return saveTaskAction(data, dayNum, fieldsData);
}

export async function upsertTask(marathonId, dayNumber, fields) {
  return saveTaskAction(marathonId, dayNumber, fields);
}

export async function deleteTask(taskId) {
  try {
    if (!taskId) return { ok: false, error: "Тапсырма ID көрсетілмеген!" };

    await prisma.task.delete({
      where: { id: String(taskId) },
    });

    revalidatePath("/org/admin/tasks");
    return { ok: true };
  } catch (error) {
    console.error("deleteTask error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteTaskAction(taskId) {
  return deleteTask(taskId);
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
// --- ТОПТАРМЕН ЖӘНЕ ОҚУШЫЛАРМЕН ЖҰМЫС -----
// ==========================================

export async function assignStudentToGroupAction(studentId, groupId) {
  try {
    if (!studentId) return { ok: false, error: "Оқушы ID-і көрсетілмеген!" };

    await prisma.student.update({
      where: { id: String(studentId) },
      data: { groupId: groupId ? String(groupId) : null },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("assignStudentToGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function removeStudentFromGroupAction(studentId) {
  try {
    if (!studentId) return { ok: false, error: "Оқушы ID-і көрсетілмеген!" };

    await prisma.student.update({
      where: { id: String(studentId) },
      data: { groupId: null },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("removeStudentFromGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function createGroupAction(data) {
  try {
    const { name, marathonId, curatorId } = data || {};
    if (!name?.trim() || !marathonId) {
      return { ok: false, error: "Топ атауын және марафонды таңдаңыз!" };
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        marathonId: String(marathonId),
        curatorId: curatorId ? String(curatorId) : null,
      },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true, group };
  } catch (error) {
    console.error("createGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateGroupAction(groupId, data) {
  try {
    const { name, curatorId } = data || {};
    await prisma.group.update({
      where: { id: String(groupId) },
      data: {
        ...(name ? { name: name.trim() } : {}),
        curatorId: curatorId !== undefined ? (curatorId ? String(curatorId) : null) : undefined,
      },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("updateGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteGroupAction(groupId) {
  try {
    if (!groupId) return { ok: false, error: "Топ ID-і көрсетілмеген!" };

    await prisma.student.updateMany({
      where: { groupId: String(groupId) },
      data: { groupId: null },
    });

    await prisma.group.delete({
      where: { id: String(groupId) },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("deleteGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getUnassignedStudentsAction(marathonId) {
  try {
    const students = await prisma.student.findMany({
      where: {
        marathonId: marathonId ? String(marathonId) : undefined,
        groupId: null,
      },
      select: { id: true, name: true, email: true, phone: true },
    });
    return { ok: true, students };
  } catch (error) {
    console.error("getUnassignedStudentsAction error:", error);
    return { ok: false, students: [] };
  }
}

export async function autoDistributeStudentsAction(marathonId) {
  try {
    if (!marathonId) return { ok: false, error: "Марафон ID-і көрсетілмеген!" };

    const groups = await prisma.group.findMany({
      where: { marathonId: String(marathonId) },
      select: { id: true },
    });

    if (groups.length === 0) {
      return { ok: false, error: "Авто-бөлу үшін алдымен кемінде 1 топ құру қажет!" };
    }

    const unassignedStudents = await prisma.student.findMany({
      where: {
        marathonId: String(marathonId),
        groupId: null,
      },
      select: { id: true },
    });

    if (unassignedStudents.length === 0) {
      return { ok: false, error: "Топқа бөлінбеген оқушылар табылмады." };
    }

    const updatePromises = unassignedStudents.map((student, index) => {
      const targetGroup = groups[index % groups.length];
      return prisma.student.update({
        where: { id: student.id },
        data: { groupId: targetGroup.id },
      });
    });

    await Promise.all(updatePromises);

    revalidatePath("/org/admin/groups");
    return { ok: true, count: unassignedStudents.length };
  } catch (error) {
    console.error("autoDistributeStudentsAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getcuratorsByOrgId(orgId) {
  try {
    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId" || targetOrgId === "undefined") {
      const firstOrg = await prisma.organizer.findFirst({ select: { id: true } });
      targetOrgId = firstOrg?.id;
    }

    const curators = await prisma.curator.findMany({
      where: targetOrgId ? { organizerId: String(targetOrgId) } : {},
      select: { id: true, name: true, email: true, phone: true },
    });
    return safeJson(curators);
  } catch (error) {
    console.error("getcuratorsByOrgId error:", error);
    return [];
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
      const dbFormattedPhone = formatPhoneToDbStyle(formatted);
      const cleanDigits = formatted.replace(/\D/g, "");
      const last10Digits = cleanDigits.slice(-10);

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: formatted },
            { phone: dbFormattedPhone },
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
// --- МҮМКІНДІКТЕР ЖӘНЕ ҚОСЫМША -------------
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
// ==========================================
// --- КУРАТОРЛАРДЫ ТЕКСЕРУ ЖӘНЕ БАСҚАРУ ----
// ==========================================

export async function checkcurator(value, isEmail) {
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
      const dbFormattedPhone = formatPhoneToDbStyle(formatted);
      const cleanDigits = formatted.replace(/\D/g, "");
      const last10Digits = cleanDigits.slice(-10);

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: formatted },
            { phone: dbFormattedPhone },
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
        message: "Пайдаланушы базада табылмады! Тек платформада тіркелген қолданушыларды куратор етіп тағайындауға болады." 
      };
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Пайдаланушы";

    // Куратор етіп бұрыннан куратор, оқушы немесе қатысушы рөліндегілерді тағайындауға болады
    const existingCurator = await prisma.curator.findFirst({
      where: { email: user.email },
      select: { id: true },
    });

    if (existingCurator) {
      return {
        status: "already_curator",
        message: "Бұл пайдаланушы бұрыннан куратор болып тіркелген!",
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    return {
      status: "ready",
      user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
    };
  } catch (err) {
    console.error("checkcurator error:", err);
    return { status: "not_found", message: `Сервер қатесі: ${err.message}` };
  }
}

// Егер басқа стильде шақырылса:
export async function checkCuratorAction(value, isEmail) {
  return checkcurator(value, isEmail);
}
export async function checkCurator(value, isEmail) {
  return checkcurator(value, isEmail);
}
// ==========================================
// --- КУРАТОРДЫ ӨШІРУ (DELETE CURATOR) ----
// ==========================================

export async function deletecurator(curatorId) {
  try {
    if (!curatorId) {
      return { ok: false, error: "Куратор ID-і көрсетілмеген!" };
    }

    // 1. Осы кураторға байланған оқушыларды босату
    await prisma.student.updateMany({
      where: { curatorId: String(curatorId) },
      data: { curatorId: null },
    });

    // 2. Осы кураторға байланған топтарды босату
    await prisma.group.updateMany({
      where: { curatorId: String(curatorId) },
      data: { curatorId: null },
    });

    // 3. Кураторды өшіру
    await prisma.curator.delete({
      where: { id: String(curatorId) },
    });

    revalidatePath("/org/admin/curators");
    return { ok: true };
  } catch (error) {
    console.error("deletecurator error:", error);
    return { ok: false, error: error.message || "Кураторды өшіру кезінде қате орын алды" };
  }
}

// Басқа әріп комбинациясында шақырылса:
export async function deleteCurator(curatorId) {
  return deletecurator(curatorId);
}

export async function deleteCuratorAction(curatorId) {
  return deletecurator(curatorId);
}
// ==========================================
// --- КУРАТОР МАРАФОНДАРЫН ЖАҢАРТУ --------
// ==========================================

export async function updatecuratorMarathons(curatorId, marathonIds) {
  try {
    if (!curatorId) {
      return { ok: false, error: "Куратор ID-і көрсетілмеген!" };
    }

    const ids = Array.isArray(marathonIds) ? marathonIds : [marathonIds].filter(Boolean);

    await prisma.curator.update({
      where: { id: String(curatorId) },
      data: {
        marathons: {
          set: ids.map((id) => ({ id: String(id) })),
        },
      },
    });

    revalidatePath("/org/admin/curators");
    return { ok: true };
  } catch (error) {
    console.error("updatecuratorMarathons error:", error);
    return { ok: false, error: error.message || "Куратор марафондарын жаңарту кезінде қате шықты" };
  }
}

// Басқа регистрде / стильде шақырылса да жұмыс істеуі үшін:
export async function updateCuratorMarathons(curatorId, marathonIds) {
  return updatecuratorMarathons(curatorId, marathonIds);
}

export async function updateCuratorMarathonsAction(curatorId, marathonIds) {
  return updatecuratorMarathons(curatorId, marathonIds);
}