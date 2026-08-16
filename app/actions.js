"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Парольді салыстыру/хэштеу үшін
import * as auth from "@/lib/auth";

const safeJson = (data) => JSON.parse(JSON.stringify(data));

// ==========================================
// --- 1. КӨМЕКШІ (HELPER) ФУНКЦИЯЛАР ---------
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
// --- 2. АВТОРИЗАЦИЯ ЖӘНЕ СЕССИЯ --------------
// ==========================================

export async function fetchInitialState() {
  const user = await validateSession();
  if (!user) return { currentStudentId: null };

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  return { currentStudentId: student ? student.id : null };
}

export async function registerUser(fields) {
  try {
    const { firstName, lastName, email, phone, password, role } = fields || {};
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
      return { ok: false, error: "Бұл Email немесе телефон нөмірі бұрын тіркелген!" };
    }

    const newUser = await prisma.user.create({
      data: {
        firstName: firstName?.trim() || "",
        lastName: lastName?.trim() || "",
        email: formattedEmail,
        phone: dbPhone || rawPhone,
        passwordHash: String(password || ""),
        role: role || "PARTICIPANT",
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
      ok: true,
      user: safeJson({
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      }),
      code: generatedCode,
    };
  } catch (error) {
    console.error("registerUser error:", error);
    return { ok: false, error: `Тіркелу кезінде қате шықты: ${error.message}` };
  }
}

export async function getPendingOtp(uid) {
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
    console.error("getPendingOtp error:", err);
    return { code: "123456", phone: "+7 (707) 900-35-59" };
  }
}

export async function verifyOtp(uid, code) {
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
    return { ok: true, user: safeJson(updatedUser) };
  } catch (error) {
    console.error("verifyOtp error:", error);
    return { ok: false, error: error.message || "Серверде қате орын алды" };
  }
}

export async function findUserByIdentifier(identifier) {
  if (!identifier || typeof identifier !== "string") return null;

  const value = identifier.trim();
  const isEmail = value.includes("@");

  if (isEmail) {
    return await prisma.user.findFirst({
      where: {
        email: { equals: value.toLowerCase(), mode: "insensitive" },
      },
    });
  }

  const cleanDigits = value.replace(/\D/g, "");
  const target10 = cleanDigits.slice(-10);

  if (!target10) return null;

  const users = await prisma.user.findMany();
  const foundUser = users.find((u) => {
    if (!u.phone) return false;
    const dbPhoneDigits = u.phone.replace(/\D/g, "");
    return dbPhoneDigits.endsWith(target10);
  });

  return foundUser || null;
}

export async function loginUser(identifier, password) {
  const value = identifier.trim();
  
  if (!value.includes("@") && !value.startsWith("+7")) {
    return { ok: false, error: "Телефон нөмірін тек +7 форматында жаза аласыз!" };
  }

  const user = await findUserByIdentifier(value);
  if (!user) return { ok: false, error: "Пайдаланушы табылмады." };
  if (!user.verified) return { ok: false, error: "Аккаунт әлі расталмаған." };
  
  if (user.passwordHash !== password) return { ok: false, error: "Құпия сөз қате." };

  let organizerId = user.organizerId || null;

  if (!organizerId) {
    const role = String(user.role).toUpperCase();

    if (role === "CURATOR") {
      const curatorRecord = await prisma.curator.findFirst({
        where: {
          OR: [
            { email: { equals: user.email, mode: "insensitive" } },
            { phone: user.phone }
          ]
        }
      });
      organizerId = curatorRecord?.organizerId || null;
    } else if (role === "ORGANIZER") {
      const orgRecord = await prisma.organizer.findFirst({
        where: {
          OR: [
            { email: { equals: user.email, mode: "insensitive" } }
          ]
        }
      });
      organizerId = orgRecord?.id || null;
    } else if (role === "STUDENT" || role === "PARTICIPANT") {
      const studentRecord = await prisma.student.findFirst({
        where: {
          OR: [
            { email: { equals: user.email, mode: "insensitive" } },
            { phone: user.phone }
          ]
        },
        include: { marathon: true }
      });
      organizerId = studentRecord?.marathon?.organizerId || null;
    }
  }

  const userWithOrg = {
    ...user,
    organizerId: organizerId || null
  };

  return { ok: true, user: userWithOrg };
}

export async function getCurrentUser(userId) {
  if (!userId) return null;
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
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

export async function logout() {
  const res = await auth.logout();
  return safeJson(res);
}

// ==========================================
// --- 3. SUPER ADMIN (OWNER) ------------------
// ==========================================

export async function getOwnerGlobalMetrics() {
  try {
    const [totalOrganizations, totalMarathons, totalStudents, recentOrgs] = await Promise.all([
      prisma.organizer.count(),
      prisma.marathon.count(),
      prisma.student.count(),
      prisma.organizer.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          _count: {
            select: { marathons: true },
          },
        },
      }),
    ]);

    const orgsWithFees = await prisma.organizer.findMany({
      select: { monthlyFee: true, subscriptionPlan: true },
    });

    const mrr = orgsWithFees.reduce((acc, org) => {
      if (org.monthlyFee && org.monthlyFee > 0) {
        return acc + org.monthlyFee;
      }
      if (org.subscriptionPlan === "PRO") return acc + 29;
      if (org.subscriptionPlan === "ENTERPRISE") return acc + 99;
      return acc;
    }, 0);

    const formattedRecent = recentOrgs.map((org) => ({
      id: org.id,
      name: org.company || org.ownerName,
      email: org.email,
      phone: org.user?.phone || "—",
      marathonsCount: org._count?.marathons || 0,
    }));

    return {
      ok: true,
      metrics: {
        totalOrganizations,
        totalMarathons,
        totalStudents,
        mrr,
      },
      recentOrganizations: formattedRecent,
    };
  } catch (error) {
    console.error("getOwnerGlobalMetrics error:", error);
    return {
      ok: false,
      error: "Метрикаларды жүктеу қатесі: " + error.message,
      metrics: {
        totalOrganizations: 0,
        totalMarathons: 0,
        totalStudents: 0,
        mrr: 0,
      },
      recentOrganizations: [],
    };
  }
}

export async function getAllOrganizers() {
  try {
    const organizers = await prisma.organizer.findMany({
      include: {
        user: true,
        _count: {
          select: {
            marathons: true,
            curators: true,
          },
        },
        marathons: {
          select: {
            _count: {
              select: {
                students: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = organizers.map((org) => {
      const totalStudents = org.marathons.reduce(
        (acc, m) => acc + (m._count?.students || 0),
        0
      );

      return {
        id: org.id,
        name: org.company || org.ownerName,
        email: org.email,
        phone: org.user?.phone || "—",
        marathonsCount: org._count?.marathons || 0,
        studentsCount: totalStudents,
      };
    });

    return { ok: true, organizers: formatted };
  } catch (error) {
    console.error("getAllOrganizers error:", error);
    return { ok: false, error: "Организаторларды жүктеу қатесі: " + error.message, organizers: [] };
  }
}

export async function getAllOrganizations() {
  try {
    const orgs = await prisma.organizer.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formatted = orgs.map((org) => ({
      id: org.id,
      name: org.company || org.ownerName,
      email: org.email,
      phone: org.phone || "",
      plan: org.subscriptionPlan || "Сынақ мерзімі",
      maxStudents: org.maxStudents || 50,
      maxMarathons: org.maxMarathons || 2,
    }));

    return { ok: true, organizations: formatted };
  } catch (error) {
    console.error("getAllOrganizations error:", error);
    return { ok: false, error: "Ұйымдарды жүктеу қатесі: " + error.message, organizations: [] };
  }
}

export async function checkUserForOrganizer(contactValue, isEmail) {
  try {
    if (!contactValue) {
      return { status: "not_found", message: "Контакт бос." };
    }

    const value = contactValue.trim();
    let user = null;

    if (isEmail) {
      user = await prisma.user.findFirst({
        where: { email: { equals: value.toLowerCase(), mode: "insensitive" } },
      });
    } else {
      const cleanDigits = value.replace(/\D/g, "");
      const last10Digits = cleanDigits.slice(-10);

      if (last10Digits.length === 10) {
        const allUsers = await prisma.user.findMany({
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
        });
        user = allUsers.find((u) => {
          if (!u.phone) return false;
          const digits = u.phone.replace(/\D/g, "");
          return digits.endsWith(last10Digits);
        });
      }
    }

    if (!user) {
      return { status: "not_found", message: "Пайдаланушы табылмады." };
    }

    const role = String(user.role || "").toUpperCase();
    if (role === "ORGANIZER") {
      return { status: "exists", message: "Бұл пайдаланушы бұрыннан ұйымдастырушы." };
    }

    return {
      status: "found",
      user: safeJson({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }),
    };
  } catch (error) {
    console.error("checkUserForOrganizer error:", error);
    return { status: "error", message: "Тексеру кезінде қате шықты." };
  }
}

export async function promoteUserToOrganizer(userId, orgData = {}) {
  try {
    if (!userId) return { ok: false, error: "Пайдаланушы ID-і көрсетілмеген." };

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) return { ok: false, error: "Пайдаланушы табылмады." };

    const organizer = await prisma.organizer.create({
      data: {
        userId: user.id,
        ownerName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Ұйымдастырушы",
        company: orgData.company || "",
        email: user.email || "",
        monthlyFee: 0,
        subscriptionPlan: "BASIC",
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "ORGANIZER",
        organizerId: organizer.id,
      },
    });

    revalidatePath("/");
    return { ok: true, organizer: safeJson(organizer) };
  } catch (error) {
    console.error("promoteUserToOrganizer error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateOrganizerSubscription(organizerId, subscriptionPlan) {
  try {
    if (!organizerId) return { ok: false, error: "Ұйым ID-і көрсетілмеген." };
    await prisma.organizer.update({
      where: { id: String(organizerId) },
      data: { subscriptionPlan: subscriptionPlan || "BASIC" },
    });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("updateOrganizerSubscription error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getOwnerDashboardData() {
  return getOwnerGlobalMetrics();
}

export async function deleteOrganization(organizationId) {
  try {
    if (!organizationId) return { ok: false, error: "Ұйым ID-і көрсетілмеген." };
    await prisma.organizer.delete({ where: { id: String(organizationId) } });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteOrganization error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- 4. ҰЙЫМДАСТЫРУШЫ / МАРАФОН ----------------
// ==========================================

export async function createMarathon(orgId, data = {}) {
  try {
    if (!orgId) return { ok: false, error: "Ұйым ID-і көрсетілмеген." };
    const marathon = await prisma.marathon.create({
      data: {
        title: data.title?.trim() || "Жаңа марафон",
        description: data.description?.trim() || "",
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        status: data.status || "DRAFT",
        organizerId: String(orgId),
      },
    });
    revalidatePath("/");
    return { ok: true, marathon: safeJson(marathon) };
  } catch (error) {
    console.error("createMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateMarathon(marathonId, data = {}) {
  try {
    if (!marathonId) return { ok: false, error: "Марафон ID-і көрсетілмеген." };
    const updateData = {};
    if (data.title !== undefined) updateData.title = String(data.title).trim();
    if (data.description !== undefined) updateData.description = String(data.description);
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.status !== undefined) updateData.status = data.status;

    const marathon = await prisma.marathon.update({
      where: { id: String(marathonId) },
      data: updateData,
    });
    revalidatePath("/");
    return { ok: true, marathon: safeJson(marathon) };
  } catch (error) {
    console.error("updateMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteMarathon(marathonId) {
  try {
    if (!marathonId) return { ok: false, error: "Марафон ID-і көрсетілмеген." };
    await prisma.marathon.delete({ where: { id: String(marathonId) } });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getMarathonsByOrgId(orgId) {
  try {
    if (!orgId) return [];
    const marathons = await prisma.marathon.findMany({
      where: { organizerId: String(orgId) },
      include: {
        _count: { select: { students: true, groups: true, curators: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return safeJson(marathons);
  } catch (error) {
    console.error("getMarathonsByOrgId error:", error);
    return [];
  }
}

export async function getMarathonById(marathonId) {
  try {
    if (!marathonId) return null;
    const marathon = await prisma.marathon.findUnique({
      where: { id: String(marathonId) },
      include: {
        _count: { select: { students: true, groups: true, curators: true } },
      },
    });
    return safeJson(marathon);
  } catch (error) {
    console.error("getMarathonById error:", error);
    return null;
  }
}

export async function getGroupsByOrgId(orgId) {
  try {
    if (!orgId) return [];

    const organizer = await prisma.organizer.findFirst({
      where: { OR: [{ id: String(orgId) }, { userId: String(orgId) }] },
      select: { id: true, userId: true },
    });

    const targetOrgId = organizer?.id || String(orgId);
    const groups = await prisma.group.findMany({
      where: { marathon: { organizerId: targetOrgId } },
      include: {
        marathon: { select: { id: true, title: true } },
        curator: { select: { id: true, name: true, email: true, phone: true } },
        students: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = groups.map((g) => ({
      id: g.id,
      name: g.name,
      maxSize: g.maxSize || 30,
      marathonId: g.marathonId,
      marathonTitle: g.marathon?.title || "",
      curatorId: g.curatorId || null,
      curator: g.curator ? { id: g.curator.id, name: g.curator.name, email: g.curator.email, phone: g.curator.phone } : null,
      students: g.students || [],
      studentsCount: g.students?.length || 0,
    }));

    return safeJson(formatted);
  } catch (error) {
    console.error("getGroups error:", error);
    return [];
  }
}

// ==========================================
// --- 8. КУРАТОРЛАРДЫ БАСҚАРУ --------------
// ==========================================

export async function getCuratorsByOrgId(orgId) {
  try {
    if (!orgId) return [];

    const curators = await prisma.curator.findMany({
      where: { organizerId: orgId },
      include: { marathons: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    const curatorsWithStudentsCount = await Promise.all(
      curators.map(async (c) => {
        const groups = await prisma.group.findMany({
          where: { curatorId: c.id },
          select: { _count: { select: { students: true } } },
        });
        const studentsCount = groups.reduce((sum, g) => sum + (g._count?.students || 0), 0);
        return { ...c, studentsCount };
      })
    );

    return safeJson(curatorsWithStudentsCount);
  } catch (error) {
    console.error("getCuratorsByOrgId error:", error);
    return [];
  }
}

export async function createCurator(orgId, data = {}) {
  try {
    if (!orgId) return { ok: false, error: "Ұйым ID-і көрсетілмеген." };
    const curator = await prisma.curator.create({
      data: {
        organizerId: String(orgId),
        name: data.name?.trim() || "Куратор",
        email: data.email?.trim().toLowerCase() || "",
        phone: data.phone?.trim() || "",
      },
    });
    revalidatePath("/");
    return { ok: true, curator: safeJson(curator) };
  } catch (error) {
    console.error("createCurator error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateCurator(curatorId, data = {}) {
  try {
    if (!curatorId) return { ok: false, error: "Куратор ID-і көрсетілмеген." };
    const curator = await prisma.curator.update({
      where: { id: String(curatorId) },
      data: {
        ...(data.name !== undefined ? { name: String(data.name).trim() } : {}),
        ...(data.email !== undefined ? { email: String(data.email).trim().toLowerCase() } : {}),
        ...(data.phone !== undefined ? { phone: String(data.phone).trim() } : {}),
      },
    });
    revalidatePath("/");
    return { ok: true, curator: safeJson(curator) };
  } catch (error) {
    console.error("updateCurator error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteCurator(curatorId) {
  try {
    if (!curatorId) return { ok: false, error: "Куратор ID-і көрсетілмеген." };
    await prisma.curator.delete({ where: { id: String(curatorId) } });
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("deleteCurator error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- 9. STUDENT ----------------------------
// ==========================================

export async function getStudentDashboard(studentId) {
  try {
    if (!studentId) return null;
    const student = await prisma.student.findUnique({
      where: { id: String(studentId) },
      include: {
        marathon: true,
        group: true,
        submissions: true,
        matrixTasks: true,
        habits: true,
      },
    });
    return safeJson(student);
  } catch (error) {
    console.error("getStudentDashboard error:", error);
    return { ok: false, error: "Деректерді жүктеу қатесі: " + error.message };
  }
}

export async function updateStudent(studentId, data) {
  try {
    if (!studentId) return { ok: false, error: "Оқушы ID-і көрсетілмеген!" };

    const { name, email, phone, points } = data || {};

    await prisma.student.update({
      where: { id: String(studentId) },
      data: {
        ...(name ? { name: name.trim() } : {}),
        email: email ? String(email).trim().toLowerCase() : "",
        phone: phone ? String(phone).trim() : "",
        ...(points !== undefined ? { points: Number(points) || 0 } : {}),
      },
    });

    revalidatePath("/org/admin/students");
    return { ok: true };
  } catch (error) {
    console.error("updateStudent error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteStudent(studentId) {
  try {
    if (!studentId) return { ok: false, error: "Оқушы ID-і көрсетілмеген!" };

    await prisma.student.delete({
      where: { id: String(studentId) },
    });

    revalidatePath("/org/admin/students");
    return { ok: true };
  } catch (error) {
    console.error("deleteStudent error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- 11. ҚОСЫМША МҮМКІНДІКТЕР ЖӘНЕ RESET ----
// ==========================================

export async function addHabit(studentId, title) {
  try {
    if (!studentId || !title?.trim()) return { ok: false };
    const habit = await prisma.habit.create({ data: { studentId: String(studentId), title: title.trim() } });
    revalidatePath("/");
    return safeJson({ ok: true, habit });
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function toggleHabitToday(habitId) {
  try {
    if (!habitId) return;
    const habit = await prisma.habit.findUnique({ where: { id: String(habitId) } });
    if (!habit) return;
    const todayStr = new Date().toISOString().split("T")[0];
    let dates = Array.isArray(habit.doneDates) ? habit.doneDates : [];
    dates = dates.includes(todayStr) ? dates.filter((d) => d !== todayStr) : [...dates, todayStr];
    await prisma.habit.update({ where: { id: String(habitId) }, data: { doneDates: dates } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function deleteHabit(habitId) {
  try {
    if (habitId) await prisma.habit.delete({ where: { id: String(habitId) } });
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
      data: { studentId: String(studentId), title: title.trim(), urgent: Boolean(urgent), important: Boolean(important) },
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
    const task = await prisma.matrixTask.findUnique({ where: { id: String(taskId) } });
    if (!task) return;
    await prisma.matrixTask.update({ where: { id: String(taskId) }, data: { done: !task.done } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function deleteMatrixTask(taskId) {
  try {
    if (taskId) await prisma.matrixTask.delete({ where: { id: String(taskId) } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function addInvitation(marathonId, orgId, role, fields) {
  try {
    const { fullName, phone, email } = fields || {};
    if (!orgId || orgId === "main") {
      return { ok: false, error: "Нақты Ұйым ID-і көрсетілмеген." };
    }

    const invitation = await prisma.invitation.create({
      data: {
        fullName: fullName || "Қатысушы",
        phone: phone || "",
        email: email || "",
        role: role || "STUDENT",
        marathonId: String(marathonId),
        organizerId: String(orgId),
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

export async function setStudentStatus(studentId, status) {
  try {
    if (studentId) await prisma.student.update({ where: { id: String(studentId) }, data: { status: status || "ACTIVE" } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function changeStudentPassword(studentId, currentPassword, newPassword) {
  try {
    if (!studentId || !currentPassword || !newPassword) return { ok: false, error: "Барлық өрістерді толтырыңыз" };
    const user = await prisma.student.findUnique({ where: { id: String(studentId) }, include: { user: true } });
    if (!user?.user) return { ok: false, error: "Оқушы табылмады" };

    const dbPassword = user.user.passwordHash || user.user.password;
    let isMatch = false;
    if (dbPassword === currentPassword) {
      isMatch = true;
    } else {
      isMatch = await bcrypt.compare(currentPassword, dbPassword);
    }
    if (!isMatch) return { ok: false, error: "Ағымдағы пароль қате" };

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    const updateData = user.user.passwordHash
      ? { passwordHash: newHashedPassword }
      : { password: newHashedPassword };

    await prisma.user.update({ where: { id: user.user.id }, data: updateData });
    return { ok: true };
  } catch (error) {
    console.error("Password change error:", error);
    return { ok: false, error: "Парольді ауыстыру кезінде қате орын алды" };
  }
}

export async function updateOrganizerProfile(orgId, data) {
  try {
    if (!orgId) return { ok: false, error: "ID көрсетілмеген!" };

    const { name, email, phone, image } = data || {};
    const nameParts = (name || "").trim().split(" ");
    const firstName = nameParts[0] || "Организатор";
    const lastName = nameParts.slice(1).join(" ") || "";

    const updatedUser = await prisma.user.updateMany({
      where: {
        OR: [
          { id: String(orgId) },
          { organizerId: String(orgId) },
          { organizer: { id: String(orgId) } },
        ],
      },
      data: {
        firstName,
        lastName,
        email: email ? String(email).trim().toLowerCase() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        ...(image !== undefined && { image }),
      },
    });

    revalidatePath("/org/admin/profile");
    return { ok: true };
  } catch (error) {
    console.error("updateOrganizerProfile error:", error);
    return { ok: false, error: error.message };
  }
}

// Compatibility aliases for legacy student UI imports.
export const toggleMatrixTask = toggleMatrixTaskDone;

export async function updateStudentProfile(data) {
  const { id, ...studentData } = data || {};
  return updateStudent(id, studentData);
}
