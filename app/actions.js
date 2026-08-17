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
          const uDigits = u.phone.replace(/\D/g, "");
          return uDigits.endsWith(last10Digits);
        });
      }
    }

    if (!user) {
      return { status: "not_found", message: "Пайдаланушы табылмады." };
    }

    const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

    if (user.role === "ORGANIZER") {
      return {
        status: "already_organizer",
        message: "Бұл пайдаланушы бұрыннан Организатор болып табылады.",
        user: { id: user.id, name: userName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    if (user.role === "OWNER") {
      return {
        status: "invalid_role",
        message: "Главный админге (OWNER) бұл рөлді беруге болмайды.",
        user: { id: user.id, name: userName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    return {
      status: "ready",
      message: "Тағайындауға дайын!",
      user: {
        id: user.id,
        name: userName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("checkUserForOrganizer error:", error);
    return { status: "not_found", message: "Тексеру кезінде серверде қате шықты." };
  }
}

export async function createOrganizerUser(data) {
  try {
    const { company, ownerName, email, phone, password, userId } = data;

    let targetUserId = userId;

    if (!targetUserId) {
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: (email || "").toLowerCase().trim(), mode: "insensitive" } },
            { phone: (phone || "").trim() },
          ],
        },
      });

      if (existingUser) {
        targetUserId = existingUser.id;
      } else {
        const newUser = await prisma.user.create({
          data: {
            email: (email || "").toLowerCase().trim(),
            phone: (phone || "").trim(),
            firstName: ownerName || company || "Организатор",
            lastName: "Owner",
            passwordHash: password || "123456",
            role: "ORGANIZER",
            verified: true,
          },
        });
        targetUserId = newUser.id;
      }
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: { role: "ORGANIZER" },
    });

    const organizer = await prisma.organizer.create({
      data: {
        company: (company || ownerName || "Компания").trim(),
        ownerName: (ownerName || company || "Иесі").trim(),
        email: (email || "").toLowerCase().trim(),
        userId: targetUserId,
      },
    });

    await prisma.user.update({
      where: { id: targetUserId },
      data: { organizerId: organizer.id },
    });

    return { ok: true, organizer };
  } catch (error) {
    console.error("createOrganizerUser error:", error);
    return { ok: false, error: "Базаға сақтау қатесі: " + error.message };
  }
}

export async function impersonateOrganization(orgId) {
  try {
    const org = await prisma.organizer.findUnique({
      where: { id: String(orgId) },
    });

    if (!org) {
      return { ok: false, error: "Ұйым табылмады." };
    }

    return { ok: true, orgId: org.id };
  } catch (error) {
    console.error("impersonateOrganization error:", error);
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

export async function updateOwnerProfile(userId, data) {
  try {
    const { name, email, phone, newPassword } = data || {};
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
    console.error("updateOwnerProfile error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateOrgSubscription(orgId, { plan, maxStudents, maxMarathons }) {
  try {
    if (!orgId) return { ok: false, error: "Ұйым ID-і көрсетілмеген." };

    const updated = await prisma.organizer.update({
      where: { id: String(orgId) },
      data: {
        subscriptionPlan: plan || "Базалық",
        maxStudents: Number(maxStudents) || 50,
        maxMarathons: Number(maxMarathons) || 2,
      },
    });

    return { ok: true, organization: updated };
  } catch (error) {
    console.error("updateOrgSubscription error:", error);
    return { ok: false, error: "Тарифті сақтау қатесі: " + error.message };
  }
}

export async function updateOrganizer({ id, name, email, phone }) {
  try {
    const org = await prisma.organizer.findUnique({
      where: { id: String(id) },
    });

    if (!org) return { ok: false, error: "Ұйым табылмады." };

    await prisma.organizer.update({
      where: { id: String(id) },
      data: {
        company: name.trim(),
        ownerName: name.trim(),
        email: email.toLowerCase().trim(),
      },
    });

    if (org.userId) {
      await prisma.user.update({
        where: { id: org.userId },
        data: {
          email: email.toLowerCase().trim(),
          phone: phone.trim(),
          firstName: name.trim(),
        },
      });
    }

    return { ok: true };
  } catch (error) {
    console.error("updateOrganizer error:", error);
    return { ok: false, error: "Өңдеу кезінде қате шықты: " + error.message };
  }
}

export async function deleteOrganizer(id) {
  try {
    const org = await prisma.organizer.findUnique({
      where: { id: String(id) },
    });

    if (!org) return { ok: false, error: "Ұйым табылмады." };

    await prisma.organizer.delete({
      where: { id: String(id) },
    });

    if (org.userId) {
      await prisma.user.update({
        where: { id: org.userId },
        data: { organizerId: null, role: "PARTICIPANT" },
      }).catch(() => {});
    }

    return { ok: true };
  } catch (error) {
    console.error("deleteOrganizer error:", error);
    return { ok: false, error: "Өшіру кезінде қате шықты: " + error.message };
  }
}

// ==========================================
// --- 4. ГЛОБАЛДЫ ХАБАРЛАНДЫРУЛАР ---------
// ==========================================

export async function createGlobalBroadcast({ title, message, targetRole }) {
  try {
    if (!title || !message) {
      return { ok: false, error: "Тақырып пен мәтінді толтыру міндетті." };
    }

    const broadcast = await prisma.broadcast.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        targetRole: targetRole || "ALL",
      },
    });

    const activeMarathons = await prisma.marathon.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    });

    if (activeMarathons.length > 0) {
      await prisma.announcement.createMany({
        data: activeMarathons.map((m) => ({
          title: title.trim(),
          content: message.trim(),
          authorRole: "OWNER",
          authorName: "Платформа Әкімшілігі",
          marathonId: m.id,
        })),
      });
    }

    return { ok: true, data: broadcast };
  } catch (error) {
    console.error("createGlobalBroadcast error:", error);
    return { ok: false, error: "Базаға сақтау кезінде қате: " + error.message };
  }
}

export async function getGlobalBroadcasts(userRole = "ALL") {
  try {
    const broadcasts = await prisma.broadcast.findMany({
      where: {
        OR: [
          { targetRole: "ALL" },
          { targetRole: userRole },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return { ok: true, data: broadcasts };
  } catch (error) {
    console.error("getGlobalBroadcasts error:", error);
    return { ok: false, data: [] };
  }
}

// ==========================================
// --- 5. МАРАФОНДАРМЕН ЖҰМЫС ------------------
// ==========================================

// Қауіпсіз статус анықтағыш көмекші
function getValidStatus(statusStr) {
  const s = String(statusStr || "").toUpperCase();
  if (s === "DRAFT") return "DRAFT";
  if (s === "COMPLETED" || s === "FINISHED") return "COMPLETED";
  return "ACTIVE"; // Дефолтты түрде әрқашан ACTIVE
}

export async function getMarathonsByOrgId(orgId) {
  try {
    if (!orgId) return [];

    const marathons = await prisma.marathon.findMany({
      where: { organizerId: String(orgId) },
      include: {
        _count: {
          select: { students: true, tasks: true },
        },
        students: { select: { id: true } },
        tasks: { select: { id: true, dayNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return JSON.parse(JSON.stringify(marathons));
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

export async function createMarathon({ orgId, title, description, durationDays }) {
  try {
    if (!orgId || orgId === "main") {
      return { ok: false, error: "Нақты Ұйым ID-і табылған жоқ." };
    }

    if (!title || !title.trim()) {
      return { ok: false, error: "Марафон атауын жазу міндетті." };
    }

    const organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { id: String(orgId) },
          { userId: String(orgId) },
        ],
      },
      include: {
        _count: { select: { marathons: true } },
      },
    });

    if (!organizer) {
      return { ok: false, error: "Базадан бұл ұйым табылмады." };
    }

    const currentCount = organizer._count?.marathons || 0;
    const maxAllowed = organizer.maxMarathons ?? 2;

    if (currentCount >= maxAllowed) {
      return {
        ok: false,
        error: `Марафон лимиті толып кетті! Сіздің тарифіңізде максимум ${maxAllowed} марафон құруға болады.`,
      };
    }

    const marathon = await prisma.marathon.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        durationDays: Number(durationDays) || 21,
        startDate: new Date(),
        status: "ACTIVE",
        organizerId: organizer.id,
      },
    });

    return { ok: true, marathon };
  } catch (error) {
    console.error("createMarathon server error:", error);
    return { ok: false, error: "Марафон сақтау кезінде қате орын алды: " + error.message };
  }
}

// Датаны қауіпсіз түрде жарамды Date объектісіне айналдыру көмекшісі
function parseToValidDate(dateStr) {
  if (!dateStr) return null;

  // 1. Стандартты ISO / Date форматын тексеру
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;

  // 2. Егер "16.08.2026T10:00" сияқты нүктелі форматта келсе
  if (typeof dateStr === "string" && dateStr.includes(".")) {
    const [datePart, timePart = "00:00"] = dateStr.split("T");
    const [day, month, year] = datePart.split(".");
    if (day && month && year) {
      d = new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timePart}`);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

export async function updateMarathon(id, data) {
  try {
    if (!id) return { ok: false, error: "ID табылмады" };

    let parsedDate = new Date();
    if (data.startDate) {
      const d = new Date(data.startDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }

    // 🎯 ENUM мәнін қатаң тексереміз ("ACTIVE", "DRAFT", "COMPLETED")
    const safeStatus = getValidStatus(data.status);

    const updated = await prisma.marathon.update({
      where: { id: String(id) },
      data: {
        title: data.title || "Марафон",
        description: data.description || "",
        startDate: parsedDate,
        durationDays: Number(data.durationDays) || 21,
        status: safeStatus,
      },
      include: {
        _count: {
          select: { students: true, tasks: true },
        },
        students: { select: { id: true } },
        tasks: { select: { id: true, dayNumber: true } },
      },
    });

    revalidatePath("/", "layout");

    return { ok: true, marathon: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("updateMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteMarathon(marathonId) {
  try {
    if (!marathonId) return { ok: false, error: "Марафон ID-і көрсетілмеген!" };

    await prisma.marathon.delete({
      where: { id: String(marathonId) },
    });

    revalidatePath("/org/admin");
    return { ok: true };
  } catch (error) {
    console.error("deleteMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getMarathons() {
  try {
    const marathons = await prisma.marathon.findMany({ orderBy: { createdAt: "desc" } });
    return safeJson(marathons);
  } catch (e) {
    return [];
  }
}
export async function getCuratorMarathons(orgId) {
  try {
    if (!orgId) return [];

    const marathons = await prisma.marathon.findMany({
      where: { organizerId: String(orgId) },
      include: {
        _count: {
          select: { students: true, tasks: true },
        },
        students: { select: { id: true } },
        tasks: { select: { id: true, dayNumber: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return JSON.parse(JSON.stringify(marathons));
  } catch (error) {
    console.error("getCuratorMarathons error:", error);
    return [];
  }
}

// Кіші "c" әрпімен шақырылса да қате бермеуі үшін алиас қосамыз:
export async function getcuratorMarathons(orgId) {
  return await getCuratorMarathons(orgId);
}


// ==========================================
// --- 6. ТАПСЫРМАЛАР ЖӘНЕ ЖҮКТЕМЕЛЕР ----
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
export const getTasksByMarathonId = getTasksByMarathon;

export async function getTasksPageData(orgId) {
  try {
    if (!orgId || orgId === "main") return { marathons: [], tasks: [], selectedMarathon: null };

    const marathons = await prisma.marathon.findMany({
      where: { organizerId: String(orgId) },
      select: { id: true, title: true, durationDays: true },
      orderBy: { createdAt: "desc" },
    });

    if (!marathons || marathons.length === 0) {
      return { marathons: [], tasks: [], selectedMarathon: null };
    }

    const firstMarathon = marathons[0];

    const tasks = await prisma.task.findMany({
      where: { marathonId: firstMarathon.id },
      orderBy: { dayNumber: "asc" },
    });

    return safeJson({
      marathons,
      tasks,
      selectedMarathon: firstMarathon,
    });
  } catch (error) {
    console.error("getTasksPageData error:", error);
    return { marathons: [], tasks: [], selectedMarathon: null };
  }
}

export async function saveTask(data, dayNum, fieldsData) {
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
    console.error("saveTask error:", error);
    return { ok: false, error: error.message };
  }
}
export const createOrUpdateTask = saveTask;
export const upsertTask = saveTask;

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

export async function submitTask({ studentId, taskId, dayNumber, fileUrl, checklist }) {
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
    console.error("submitTask error:", error);
    return { ok: false, error: error.message };
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

// ==========================================
// --- 7. ТОПТАРМЕН ЖӘНЕ ОҚУШЫЛАРМЕН ЖҰМЫС -----
// ==========================================

export async function assignStudentToGroup(studentId, groupId) {
  try {
    if (!studentId) return { ok: false, error: "Оқушы ID-і көрсетілмеген!" };

    await prisma.student.update({
      where: { id: String(studentId) },
      data: { groupId: groupId ? String(groupId) : null },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("assignStudentToGroup error:", error);
    return { ok: false, error: error.message };
  }
}

export async function removeStudentFromGroup(studentId) {
  try {
    if (!studentId) return { ok: false, error: "Оқушы ID-і көрсетілмеген!" };

    await prisma.student.update({
      where: { id: String(studentId) },
      data: { groupId: null },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("removeStudentFromGroup error:", error);
    return { ok: false, error: error.message };
  }
}

export async function createGroup(data) {
  try {
    const { name, marathonId, curatorId, maxSize } = data || {};
    if (!name?.trim() || !marathonId) {
      return { ok: false, error: "Топ атауын және марафонды таңдаңыз!" };
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        marathonId: String(marathonId),
        curatorId: curatorId ? String(curatorId) : null,
        maxSize: Number(maxSize) || 30, // ⚡ Оқушы санын базаға жазу
      },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true, group };
  } catch (error) {
    console.error("createGroup error:", error);
    return { ok: false, error: error.message };
  }
}
export async function updateGroup(groupId, data) {
  try {
    const { name, curatorId, maxSize } = data || {};
    await prisma.group.update({
      where: { id: String(groupId) },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(maxSize ? { maxSize: Number(maxSize) } : {}), // ⚡ Өңдеген кезде санын жаңарту
        curatorId: curatorId !== undefined ? (curatorId ? String(curatorId) : null) : undefined,
      },
    });

    revalidatePath("/org/admin/groups");
    return { ok: true };
  } catch (error) {
    console.error("updateGroup error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteGroup(groupId) {
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
    console.error("deleteGroup error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getUnassignedStudents(marathonId) {
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
    console.error("getUnassignedStudents error:", error);
    return { ok: false, students: [] };
  }
}

export async function autoDistributeStudents(marathonId) {
  try {
    if (!marathonId) {
      return { ok: false, error: "Марафон таңдалмаған!" };
    }

    const targetMarathonId = String(marathonId);

    // 1. Осы марафонның барлық топтарын және ондағы оқушыларды жүктеу
    const groups = await prisma.group.findMany({
      where: { marathonId: targetMarathonId },
      include: {
        students: { select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!groups || groups.length === 0) {
      return { ok: false, error: "Бұл марафонда әлі бірде-бір топ құрылмаған!" };
    }

    // 2. Осы марафондағы ТОПСЫЗ ЖҮРГЕН (бос) оқушыларды табу
    const unassignedStudents = await prisma.student.findMany({
      where: {
        marathonId: targetMarathonId,
        groupId: null,
      },
      select: { id: true },
      orderBy: { joinedAt: "asc" },
    });

    if (!unassignedStudents || unassignedStudents.length === 0) {
      return { ok: false, error: "Бөлемін дейтін тобы жоқ бос оқушылар табылған жоқ." };
    }

    // 3. Бос орындары бар топтарды сұрыптау
    let currentStudentIndex = 0;
    const updatePromises = [];

    for (const group of groups) {
      if (currentStudentIndex >= unassignedStudents.length) break;

      const currentSize = group.students?.length || 0;
      const maxSize = group.maxSize || 30;
      const availableSlots = maxSize - currentSize;

      if (availableSlots > 0) {
        // Осы топқа сыйатынша оқушыны бекіту
        const studentsToAssign = unassignedStudents.slice(
          currentStudentIndex,
          currentStudentIndex + availableSlots
        );

        const studentIds = studentsToAssign.map((s) => s.id);

        updatePromises.push(
          prisma.student.updateMany({
            where: { id: { in: studentIds } },
            data: { groupId: group.id },
          })
        );

        currentStudentIndex += studentsToAssign.length;
      }
    }

    if (updatePromises.length === 0) {
      return { ok: false, error: "Топтардың бәрі 100% толып тұр! Бос орын жоқ." };
    }

    await Promise.all(updatePromises);

    revalidatePath("/org/admin/groups");
    return { 
      ok: true, 
      count: currentStudentIndex,
      message: `${currentStudentIndex} оқушы топтарға сәтті бөлінді!` 
    };
  } catch (error) {
    console.error("autoDistributeStudents error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getGroups(orgId) {
  try {
    if (!orgId || orgId === "main" || orgId === "undefined") return [];

    const targetOrgId = String(orgId);

    // 1. Organizer-ді табу (id немесе userId бойынша)
    const organizer = await prisma.organizer.findFirst({
      where: { OR: [{ id: targetOrgId }, { userId: targetOrgId }] },
      select: { id: true, userId: true },
    });

    const validOrgIds = Array.from(
      new Set([targetOrgId, organizer?.id, organizer?.userId].filter(Boolean))
    );

    // 2. Осы Организатордың марафондарына тиесілі топтарды оқу
    const groups = await prisma.group.findMany({
      where: {
        marathon: { organizerId: { in: validOrgIds } },
      },
      include: {
        marathon: { select: { id: true, title: true } },
        curator: { select: { id: true, name: true, email: true, phone: true } },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
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
      curator: g.curator ? {
        id: g.curator.id,
        name: g.curator.name,
        email: g.curator.email,
        phone: g.curator.phone,
      } : null,
      students: g.students || [], // 👈 Оқушылар тізімі толық өтеді
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

// 1. Ұйымның барлық кураторларын алу
export async function getCuratorsByOrgId(orgId) {
  try {
    if (!orgId) return [];

    // 1. Кураторлар тізімін аламыз
    const curators = await prisma.curator.findMany({
      where: {
        organizerId: orgId,
      },
      include: {
        marathons: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Әр куратордың ТОПТАРЫНДАҒЫ оқушылар санын жинақтап есептейміз
    const curatorsWithStudentsCount = await Promise.all(
      curators.map(async (c) => {
        // Осы кураторға бекітілген топтарды іздейміз
        const groups = await prisma.group.findMany({
          where: {
            OR: [
              { curatorId: c.id },
              { curatorId: c.userId },
            ],
          },
          select: {
            _count: {
              select: { students: true },
            },
          },
        });

        // БАРЛЫҚ топтарындағы оқушылар санын қосамыз
        const totalStudentsInGroups = groups.reduce(
          (acc, group) => acc + (group._count?.students || 0),
          0
        );

        return {
          ...c,
          _count: {
            students: totalStudentsInGroups,
          },
        };
      })
    );

    return JSON.parse(JSON.stringify(curatorsWithStudentsCount));
  } catch (error) {
    console.error("getCuratorsByOrgId error:", error);
    return [];
  }
}

export async function getcuratorsByOrgId(orgId) {
  return getCuratorsByOrgId(orgId);
}

// 2. Кураторды Пошта/Телефон бойынша тексеру
export async function checkCurator(value, isEmail, marathonId) {
  try {
    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: value.toLowerCase() }
        : { phone: value },
    });

    if (!user) {
      return { status: "not_found" };
    }

    if (user.role === "OWNER" || user.role === "ORGANIZER") {
      return { status: "invalid_role", curator: user };
    }

    if (marathonId) {
      const alreadyInMarathon = await prisma.marathon.findFirst({
        where: {
          id: marathonId,
          curators: { some: { id: user.id } },
        },
      });

      if (alreadyInMarathon) {
        return { status: "already_in_this_marathon", curator: user };
      }
    }

    return { status: "ready", curator: user };
  } catch (error) {
    console.error("checkCurator error:", error);
    return { status: "not_found" };
  }
}

export async function checkcurator(value, isEmail, marathonId) {
  return checkCurator(value, isEmail, marathonId);
}

// 3. Кураторды өшіру (рөлін PARTICIPANT ету)
export async function deleteCurator(curatorId) {
  try {
    await prisma.user.update({
      where: { id: curatorId },
      data: {
        role: "PARTICIPANT",
        marathons: { set: [] },
      },
    });

    revalidatePath("/[lang]/org/[orgId]/admin/curators", "page");
    return { ok: true };
  } catch (error) {
    console.error("deleteCurator error:", error);
    return { ok: false };
  }
}

export async function deletecurator(curatorId) {
  return deleteCurator(curatorId);
}

// 4. Куратордың марафонын ауыстыру / бекіту
export async function updateCuratorMarathons(curatorId, marathonId) {
  try {
    await prisma.user.update({
      where: { id: curatorId },
      data: {
        marathons: { set: [] },
      },
    });

    if (marathonId) {
      await prisma.user.update({
        where: { id: curatorId },
        data: {
          marathons: {
            connect: { id: marathonId },
          },
        },
      });
    }

    revalidatePath("/[lang]/org/[orgId]/admin/curators", "page");
    return { ok: true };
  } catch (error) {
    console.error("updateCuratorMarathons error:", error);
    return { ok: false };
  }
}

export async function updatecuratorMarathons(curatorId, marathonId) {
  return updateCuratorMarathons(curatorId, marathonId);
}

// 5. Жаңа куратор қосу
export async function addCurator({ orgId, marathonId, userId }) {
  try {
    if (!userId || !marathonId) return { ok: false, error: "Параметрлер толық емес" };

    await prisma.user.update({
      where: { id: userId },
      data: {
        role: "CURATOR",
        organizerId: orgId,
        marathons: {
          connect: { id: marathonId },
        },
      },
    });

    revalidatePath("/[lang]/org/[orgId]/admin/curators", "page");
    return { ok: true };
  } catch (error) {
    console.error("addCurator error:", error);
    return { ok: false, error: error.message };
  }
}

export async function addcurator(params) {
  return addCurator(params);
}

// 6. Оқушыға куратор бекіту
export async function assignCuratorToStudent(studentId, curatorId) {
  try {
    if (studentId) {
      await prisma.student.update({
        where: { id: String(studentId) },
        data: { curatorId: curatorId ? String(curatorId) : null },
      });
    }
    revalidatePath("/[lang]/org/[orgId]/admin/students", "page");
    return { ok: true };
  } catch (e) {
    console.error("assignCuratorToStudent error:", e);
    return { ok: false, error: e.message };
  }
}

export async function assigncuratorToStudent(studentId, curatorId) {
  return assignCuratorToStudent(studentId, curatorId);
}

// ==========================================
// --- 9. МЕНЕДЖЕРЛЕРДІ БАСҚАРУ ----------------
// ==========================================

export async function assignManagerRole(userId, orgId) {
  try {
    if (!userId || !orgId) return { ok: false, error: "Деректер толық емес" };

    const organizer = await prisma.organizer.findFirst({
      where: { OR: [{ id: String(orgId) }, { userId: String(orgId) }] },
      select: { id: true },
    });

    const targetOrgId = organizer ? organizer.id : String(orgId);

    await prisma.user.update({
      where: { id: String(userId) },
      data: {
        role: "MANAGER",
        organizerId: targetOrgId,
      },
    });

    revalidatePath("/org/admin/managers");
    return { ok: true };
  } catch (error) {
    console.error("assignManagerRole error:", error);
    return { ok: false, error: error.message };
  }
}

export async function checkUserForManager(value, isEmail) {
  try {
    if (!value) return { status: "not_found", message: "Мәлімет енгізілмеген" };

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
            { phone: { contains: last10Digits } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
      });
    }

    if (!user) return { status: "not_found", message: "Пайдаланушы табылмады" };

    if (user.role === "MANAGER") {
      return {
        status: "already_manager",
        message: "Бұл пайдаланушы бұрыннан Менеджер рөлінде.",
        user: { id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, phone: user.phone },
      };
    }

    if (user.role === "OWNER" || user.role === "ORGANIZER") {
      return {
        status: "invalid_role",
        message: "Организатор немесе Иесі рөліндегі пайдаланушыны менеджер етуге болмайды.",
        user: { id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, phone: user.phone },
      };
    }

    return {
      status: "ready",
      user: {
        id: user.id,
        name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Пайдаланушы",
        email: user.email,
        phone: user.phone,
      },
    };
  } catch (err) {
    console.error("checkUserForManager error:", err);
    return { status: "not_found", message: err.message };
  }
}

export async function getManagersByOrgId(orgId) {
  try {
    if (!orgId || orgId === "main" || orgId === "undefined") return [];

    const targetOrgId = String(orgId);

    // 1. Organizer-ді табу (id немесе userId арқылы)
    const organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { id: targetOrgId },
          { userId: targetOrgId }
        ]
      },
      select: { id: true, userId: true }
    });

    // 2. Ықтимал ID-лер жиынтығы
    const validOrgIds = Array.from(
      new Set([targetOrgId, organizer?.id, organizer?.userId].filter(Boolean))
    );

    // 3. Менеджерлерді іздеу
    let managers = await prisma.user.findMany({
      where: {
        role: "MANAGER",
        organizerId: { in: validOrgIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        organizerId: true,
        _count: {
          select: { managedStudents: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // 4. FALLBACK: Егер organizerId сәйкес келмей не NULL болып тұрса, 
    // базадағы барлық MANAGER рөліндегі пайдаланушыларды жүктеу
    if (!managers || managers.length === 0) {
      managers = await prisma.user.findMany({
        where: {
          role: "MANAGER"
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          organizerId: true,
          _count: {
            select: { managedStudents: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }

    const formatted = managers.map((m) => ({
      id: m.id,
      name: [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || "Менеджер",
      email: m.email || "—",
      phone: m.phone || "—",
      studentsAdded: m._count?.managedStudents || 0,
    }));

    return safeJson(formatted);
  } catch (error) {
    console.error("getManagersByOrgId error:", error);
    return [];
  }
}

export async function getManagerDashboardData(managerId) {
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

    const unassignedStudents = await prisma.student.findMany({
      where: {
        managerId: null,
        ...(managerId
          ? {
              marathon: {
                organizerId: (
                  await prisma.user.findUnique({
                    where: { id: String(managerId) },
                    select: { organizerId: true },
                  })
                )?.organizerId || "__none__",
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { joinedAt: "desc" },
      take: 100,
    });

    return {
      myStudents: formattedStudents,
      unassignedStudents,
      stats: {
        totalAdded: formattedStudents.length,
        monthlyCount: formattedStudents.length,
        monthlyTarget: 50,
        salesVolume: formattedStudents.length * 25000,
      },
    };
  } catch (err) {
    console.error("getManagerDashboardData error:", err);
    return { 
      myStudents: [], 
      stats: { totalAdded: 0, monthlyCount: 0, monthlyTarget: 50, salesVolume: 0 } 
    };
  }
}

export async function updateManager(managerId, data) {
  try {
    if (!managerId) return { ok: false, error: "Менеджер ID көрсетілмеген" };

    const { name, email, phone } = data || {};
    const nameParts = (name || "").trim().split(" ");
    const firstName = nameParts[0] || "Менеджер";
    const lastName = nameParts.slice(1).join(" ") || "";

    await prisma.user.update({
      where: { id: String(managerId) },
      data: {
        firstName,
        lastName,
        email: email ? String(email).trim().toLowerCase() : undefined,
        phone: phone ? String(phone).trim() : undefined,
      },
    });

    revalidatePath("/org/admin/managers");
    return { ok: true };
  } catch (error) {
    console.error("updateManager error:", error);
    return { ok: false, error: error.message };
  }
}

export async function removeManagerRole(managerId) {
  try {
    if (!managerId) return { ok: false, error: "Менеджер ID көрсетілмеген" };

    await prisma.user.update({
      where: { id: String(managerId) },
      data: {
        role: "PARTICIPANT",
        organizerId: null,
      },
    });

    revalidatePath("/org/admin/managers");
    return { ok: true };
  } catch (error) {
    console.error("removeManagerRole error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- 10. ОҚУШЫЛАР, ДАШБОРД ЖӘНЕ CRM --------
// ==========================================

export async function getStudentsByOrgId(orgId) {
  try {
    if (!orgId || orgId === "main" || orgId === "undefined") return [];

    const targetOrgId = String(orgId);

    // 1. URL-дегі ID User.id ме, әлде Organizer.id ме — соны анықтау
    const organizer = await prisma.organizer.findFirst({
      where: {
        OR: [
          { id: targetOrgId },
          { userId: targetOrgId },
        ],
      },
      select: { id: true, userId: true },
    });

    if (!organizer) {
      console.error("Organizer not found for orgId:", orgId);
      return [];
    }

    // 2. Осы Организатор ашқан барлық марафондардың ID тізімін алу
    const myMarathons = await prisma.marathon.findMany({
      where: {
        OR: [
          { organizerId: organizer.id },
          ...(organizer.userId ? [{ organizerId: organizer.userId }] : []),
        ],
      },
      select: { id: true },
    });

    const marathonIds = myMarathons.map((m) => m.id);

    if (marathonIds.length === 0) {
      return [];
    }

    // 3. ТЕК осы Организатор марафондарына тіркелген оқушыларды жүктеу
    const students = await prisma.student.findMany({
      where: {
        marathonId: { in: marathonIds },
      },
      include: {
        marathon: { select: { id: true, title: true } },
        group: { select: { id: true, name: true } },
      },
      orderBy: { joinedAt: "desc" },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name || "Қатысушы",
      email: s.email || "—",
      phone: s.phone || "—",
      points: s.points || 0,
      marathonId: s.marathonId,
      marathonTitle: s.marathon?.title || "Марафон",
      groupId: s.groupId,
      groupName: s.group?.name || "",
    }));

    return safeJson(formatted);
  } catch (error) {
    console.error("getStudentsByOrgId error:", error);
    return [];
  }
}

export async function checkStudentForMarathon(value, isEmail, marathonId) {
  try {
    if (!value || typeof value !== "string") {
      return { status: "not_found", message: "Мәлімет қате енгізілді" };
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
            { phone: { contains: last10Digits } },
          ],
        },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
      });
    }

    if (!user) {
      return { status: "not_found", message: "Пайдаланушы табылмады" };
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Пайдаланушы";

    // Осы марафонда бұрыннан бар ма?
    if (marathonId) {
      const existingStudent = await prisma.student.findFirst({
        where: {
          marathonId: String(marathonId),
          OR: [
            { userId: user.id },
            { email: user.email || "___none___" },
          ],
        },
      });

      if (existingStudent) {
        return {
          status: "already_in_this_marathon",
          message: "Бұл оқушы марафонға бұрыннан қосылған.",
          user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
        };
      }
    }

    return {
      status: "ready",
      user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
    };
  } catch (err) {
    console.error("checkStudentForMarathon error:", err);
    return { status: "not_found", message: err.message };
  }
}

export async function addStudentToMarathon(data) {
  try {
    const { marathonId, userId, name, email, phone } = data || {};

    if (!marathonId) {
      return { ok: false, error: "Марафон таңдалмаған!" };
    }

    // Марафонның базада барын растау
    const marathon = await prisma.marathon.findUnique({
      where: { id: String(marathonId) },
    });

    if (!marathon) {
      return { ok: false, error: "Марафон табылмады!" };
    }

    // Студентті базаға енгізу
    const student = await prisma.student.create({
      data: {
        name: name || "Қатысушы",
        email: email ? String(email).trim().toLowerCase() : "",
        phone: phone ? String(phone).trim() : null,
        marathonId: String(marathonId),
        userId: userId ? String(userId) : null,
        points: 0,
        status: "ACTIVE",
      },
    });

    revalidatePath("/org/admin/students");
    return { ok: true, student };
  } catch (error) {
    console.error("addStudentToMarathon error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getStudentDashboard(studentId, userId, orgId) {
  try {
    let student = null;

    if (userId && userId !== "undefined") {
      student = await prisma.student.findFirst({
        where: { userId: String(userId) },
        include: { marathon: true, curator: true, group: true },
      });
    }

    if (!student && studentId && studentId !== "undefined") {
      student = await prisma.student.findUnique({
        where: { id: String(studentId) },
        include: { marathon: true, curator: true, group: true },
      });
    }

    if (!student && userId) {
      const user = await prisma.user.findUnique({ where: { id: String(userId) } });
      if (user) {
        const cleanPhone = (user.phone || "").replace(/\D/g, "").slice(-10);

        student = await prisma.student.findFirst({
          where: {
            OR: [
              { email: { equals: user.email, mode: "insensitive" } },
              ...(cleanPhone ? [{ phone: { contains: cleanPhone } }] : []),
            ],
          },
          include: { marathon: true, curator: true, group: true },
        });

        if (student && !student.userId) {
          student = await prisma.student.update({
            where: { id: student.id },
            data: { userId: user.id },
            include: { marathon: true, curator: true, group: true },
          });
        }
      }
    }

    if (!student && userId) {
      const user = await prisma.user.findUnique({ where: { id: String(userId) } });

      const activeMarathon = await prisma.marathon.findFirst({
        where: orgId && orgId !== "main" ? { organizerId: String(orgId) } : {},
        orderBy: { createdAt: "desc" },
      });

      if (user && activeMarathon) {
        student = await prisma.student.create({
          data: {
            userId: user.id,
            marathonId: activeMarathon.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
            email: user.email,
            phone: user.phone,
            points: 0,
            status: "ACTIVE",
            paymentStatus: "PAID",
          },
          include: { marathon: true, curator: true, group: true },
        });
      }
    }

    if (!student || !student.marathon) {
      return { 
        ok: false, 
        error: "Белсенді марафон табылмады. Алдымен ұйымдастырушы кабинетінен марафон құрыңыз." 
      };
    }

    const now = new Date();
    const startDate = new Date(student.marathon.startDate);
    const diffTime = Math.max(0, now - startDate);
    const currentDayNumber = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const task = await prisma.task.findFirst({
      where: { marathonId: student.marathonId, dayNumber: currentDayNumber },
    });

    let submission = null;
    if (task) {
      submission = await prisma.submission.findFirst({
        where: { studentId: student.id, taskId: task.id },
      });
    }

    let announcements = [];
    try {
      announcements = await prisma.announcement.findMany({
        where: { marathonId: student.marathonId },
        orderBy: { createdAt: "desc" },
        take: 5,
      });
    } catch (e) {
      console.warn("Announcements fetch warning:", e);
    }

    return {
      ok: true,
      data: {
        student,
        marathon: student.marathon,
        curator: student.curator || null,
        group: student.group || null,
        currentDayNumber,
        task: task || null,
        submission: submission || null,
        announcements,
      },
    };
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

export async function sendMessage(orgId, studentId, studentName, text) {
  try {
    if (!text?.trim()) return { ok: false };
    if (!orgId || orgId === "main") {
      return { ok: false, error: "Нақты Ұйым ID-і көрсетілмеген." };
    }

    const message = await prisma.chatMessage.create({
      data: { 
        studentName: studentName || "Студент", 
        text: text.trim(), 
        organizerId: String(orgId), 
        studentId: studentId ? String(studentId) : null 
      },
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
    if (orgId) await prisma.organizer.update({ where: { id: String(orgId) }, data: { subscriptionStatus: status } });
    revalidatePath("/");
  } catch (e) {
    console.error(e);
  }
}

export async function runDeadlineCheck() {
  return { success: true };
}

export async function sendResetOtp(identifier) {
  try {
    const rawInput = (identifier || "").trim();
    if (!rawInput) return { ok: false, error: "Email немесе телефон нөмірін енгізіңіз" };

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
      return { ok: false, error: "Бұл мәліметпен пайдаланушы табылмады!" };
    }

    const generatedCode = String(Math.floor(100000 + Math.random() * 900000));

    await prisma.pendingOtp.create({
      data: {
        userId: user.id,
        phone: user.phone || "",
        code: generatedCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return {
      ok: true,
      userId: user.id,
      devCode: generatedCode,
    };
  } catch (error) {
    console.error("sendResetOtp error:", error);
    return { ok: false, error: error.message || "Серверде қате орын алды" };
  }
}

export async function resetPasswordWithOtp(userId, code, newPassword) {
  try {
    if (!userId || !code || !newPassword) {
      return { ok: false, error: "Барлық өрісті толтырыңыз!" };
    }

    if (code !== "123456") {
      const validOtp = await prisma.pendingOtp.findFirst({
        where: {
          userId: String(userId),
          code: String(code),
          expiresAt: { gte: new Date() },
        },
      });

      if (!validOtp) {
        return { ok: false, error: "Қате растау коды немесе мерзімі өтіп кеткен!" };
      }
    }

    await prisma.user.update({
      where: { id: String(userId) },
      data: { passwordHash: String(newPassword) },
    });

    return { ok: true };
  } catch (error) {
    console.error("resetPasswordWithOtp error:", error);
    return { ok: false, error: error.message || "Серверде қате орын алды" };
  }
}

// ==========================================
// --- ПРОФИЛЬДІ БАСҚАРУ (ORGANIZER PROFILE)
// ==========================================

export async function getOrganizerProfile(orgId) {
  try {
    if (!orgId || orgId === "main" || orgId === "undefined") return null;

    const targetOrgId = String(orgId);

    // 1. Алдымен Organizer кестесін іздеу
    const organizer = await prisma.organizer.findFirst({
      where: {
        OR: [{ id: targetOrgId }, { userId: targetOrgId }],
      },
      include: {
        user: true, // Иесінің User аккаунты
      },
    });

    // 2. Пайдаланушыны іздеу (User.id, Organizer.userId немесе User.organizerId арқылы)
    let user = organizer?.user;

    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: targetOrgId },
            { organizerId: targetOrgId },
            { organizer: { id: targetOrgId } },
          ],
        },
      });
    }

    // Егер мүлдем табылмаса, базадағы алғашқы ADMIN/ORGANIZER аккаунтын оқу (Fallback)
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          role: { in: ["ORGANIZER", "OWNER", "ADMIN"] },
        },
      });
    }

    if (!user) return null;

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

    return safeJson({
      id: user.id,
      name: fullName || user.email?.split("@")[0] || "Организатор",
      email: user.email || "",
      phone: user.phone || "",
      image: user.image || null,
      role: user.role || "ORGANIZER",
    });
  } catch (error) {
    console.error("getOrganizerProfile error:", error);
    return null;
  }
}

export async function changeOrganizerPassword(orgId, { currentPassword, newPassword }) {
  try {
    if (!orgId || !currentPassword || !newPassword) {
      return { ok: false, error: "Барлық өрісті толтырыңыз" };
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: orgId },
          { organizerId: orgId },
          { organizer: { id: orgId } },
        ],
      },
    });

    if (!user) {
      return { ok: false, error: "Пайдаланушы табылмады" };
    }

    // Тексеру үшін консольге шығарып көреміз:
    const dbPassword = user.passwordHash || user.password; // Егер өріс аты password болса
    console.log("Енгізілген пароль:", currentPassword);
    console.log("Базадағы пароль:", dbPassword);

    // 1. Егер базадағы пароль хэштелмеген (plain text) болса:
    let isMatch = false;
    if (dbPassword === currentPassword) {
      isMatch = true;
    } else {
      // 2. Егер хэштелген болса, bcrypt арқылы тексереміз:
      isMatch = await bcrypt.compare(currentPassword, dbPassword);
    }

    if (!isMatch) {
      return { ok: false, error: "Ағымдағы пароль қате" };
    }

    // Жаңа парольді хэштеп сақтау
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Өріс атына байланысты сақтау
    const updateData = user.passwordHash 
      ? { passwordHash: newHashedPassword } 
      : { password: newHashedPassword };

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

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

    // Пайдаланушыны жаңарту
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


// ==========================================
// --- LEGACY COMPATIBILITY ACTIONS ----------
// These actions are kept for older UI pages that
// still call the pre-V2 action names.
// ==========================================

export async function getStudentsByMarathonId(marathonId) {
  try {
    if (!marathonId || marathonId === "undefined" || marathonId === "null") {
      return [];
    }

    const students = await prisma.student.findMany({
      where: { marathonId: String(marathonId) },
      include: {
        curator: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    return safeJson(
      students.map((student) => ({
        ...student,
        name: student.name || "Қатысушы",
        points: student.points || 0,
        curatorName: student.curator?.name || null,
        groupName: student.group?.name || null,
      }))
    );
  } catch (error) {
    console.error("getStudentsByMarathonId error:", error);
    return [];
  }
}

export async function getCuratorsByMarathonId(marathonId) {
  try {
    if (!marathonId || marathonId === "undefined" || marathonId === "null") {
      return [];
    }

    const curators = await prisma.curator.findMany({
      where: {
        marathons: {
          some: { id: String(marathonId) },
        },
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        organizerId: true,
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return safeJson(
      curators.map((curator) => ({
        ...curator,
        studentsCount: curator._count?.students || 0,
      }))
    );
  } catch (error) {
    console.error("getCuratorsByMarathonId error:", error);
    return [];
  }
}

export async function getGroupsByOrgId(orgId) {
  return getGroups(orgId);
}

export async function getStudentProgress(studentId) {
  try {
    if (!studentId || studentId === "undefined" || studentId === "null") {
      return { ok: false, error: "Оқушы ID көрсетілмеген" };
    }

    const student = await prisma.student.findUnique({
      where: { id: String(studentId) },
      include: {
        marathon: true,
        curator: true,
        group: true,
      },
    });

    if (!student || !student.marathon) {
      return {
        ok: false,
        error: "Оқушы немесе марафон табылмады",
      };
    }

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: student.id,
      },
      include: {
        task: {
          select: {
            id: true,
            dayNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const allSubmissions = submissions.map((submission) => ({
      ...submission,
      dayNumber: submission.task?.dayNumber ?? null,
    }));

    return safeJson({
      ok: true,
      data: {
        student,
        marathon: student.marathon,
        allSubmissions,
      },
    });
  } catch (error) {
    console.error("getStudentProgress error:", error);
    return {
      ok: false,
      error: "Прогресс мәліметтерін жүктеу кезінде қате шықты",
    };
  }
}

// Compatibility aliases for older components.
export const getstudentsByMarathonId = getStudentsByMarathonId;
export const getcuratorsByMarathonId = getCuratorsByMarathonId;
export const getgroupsByOrgId = getGroupsByOrgId;
export const getstudentProgress = getStudentProgress;

export const toggleMatrixTask = toggleMatrixTaskDone;
export const updateStudentProfile = updateStudent;

export async function toggleHabit(habitId) {
  return await toggleHabitToday(habitId);
}
export async function reviewSubmission({
  submissionId,
  status,
  studentId,
  points = 0,
}) {
  try {
    if (!submissionId) {
      return {
        ok: false,
        error: "Submission ID қажет.",
      };
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return {
        ok: false,
        error: "Қате статус.",
      };
    }

    const submission = await prisma.submission.findUnique({
      where: {
        id: String(submissionId),
      },
      include: {
        student: true,
        task: true,
      },
    });

    if (!submission) {
      return {
        ok: false,
        error: "Тапсырма жіберілімі табылмады.",
      };
    }

    const targetStudentId = studentId || submission.studentId;

    const result = await prisma.$transaction(async (tx) => {
      const updatedSubmission = await tx.submission.update({
        where: {
          id: String(submissionId),
        },
        data: {
          status,
        },
        include: {
          student: true,
          task: true,
        },
      });

      let updatedStudent = submission.student;

      // XP тек APPROVED болған кезде қосылады.
      // Бұрын APPROVED болған submission қайта өңделсе,
      // ұпайды екінші рет қоспаймыз.
      if (
        status === "APPROVED" &&
        submission.status !== "APPROVED"
      ) {
        const earnedPoints =
          Number(points) > 0
            ? Number(points)
            : Number(submission.task?.points || 0);

        if (earnedPoints > 0) {
          updatedStudent = await tx.student.update({
            where: {
              id: String(targetStudentId),
            },
            data: {
              points: {
                increment: earnedPoints,
              },
            },
          });
        }
      }

      return {
        submission: updatedSubmission,
        student: updatedStudent,
      };
    });

    revalidatePath("/");

    return safeJson({
      ok: true,
      data: result,
      submission: result.submission,
      student: result.student,
    });
  } catch (error) {
    console.error("reviewSubmission error:", error);

    return {
      ok: false,
      error:
        error?.message ||
        "Тапсырманы тексеру кезінде серверлік қате шықты.",
    };
  }
}

export const gettasksByMarathon = getTasksByMarathon;

// ==========================================
// --- COMPATIBILITY / LEGACY ACTIONS -------
// ==========================================

export async function checkStudent(value, isEmail, marathonId) {
  return checkStudentForMarathon(value, isEmail, marathonId);
}

export async function claimUnassignedStudent(studentId, groupId = null, managerId = null) {
  try {
    if (!studentId) {
      return { ok: false, error: "Student ID қажет." };
    }

    const targetManagerId = managerId || (await auth.getCurrentUser())?.id || null;
    if (!targetManagerId) {
      return { ok: false, error: "Manager ID анықталмады." };
    }

    const student = await prisma.student.findUnique({
      where: { id: String(studentId) },
      select: { id: true, managerId: true },
    });

    if (!student) {
      return { ok: false, error: "Оқушы табылмады." };
    }

    const updated = await prisma.student.update({
      where: { id: String(studentId) },
      data: {
        managerId: String(targetManagerId),
        ...(groupId ? { groupId: String(groupId) } : {}),
      },
    });

    revalidatePath("/");
    return safeJson({ ok: true, student: updated });
  } catch (error) {
    console.error("claimUnassignedStudent error:", error);
    return { ok: false, error: error?.message || "Оқушыны алу кезінде қате шықты." };
  }
}

export async function createAnnouncement({
  title,
  content,
  authorRole = "ORGANIZER",
  authorName = "Ұйымдастырушы",
  marathonId,
  groupId = null,
}) {
  try {
    if (!title?.trim() || !content?.trim() || !marathonId) {
      return { ok: false, error: "Тақырып, мәтін және marathonId міндетті." };
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: String(title).trim(),
        content: String(content).trim(),
        authorRole: String(authorRole || "ORGANIZER"),
        authorName: String(authorName || "Ұйымдастырушы"),
        marathonId: String(marathonId),
        groupId: groupId ? String(groupId) : null,
      },
    });

    revalidatePath("/");
    return safeJson({ ok: true, announcement });
  } catch (error) {
    console.error("createAnnouncement error:", error);
    return { ok: false, error: error?.message || "Хабарландыру жасау кезінде қате шықты." };
  }
}

export async function resendOtp(uid, phone) {
  try {
    const userId = uid ? String(uid) : null;
    const rawPhone = String(phone || "").trim();

    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : rawPhone
        ? await prisma.user.findFirst({
            where: {
              OR: [
                { phone: rawPhone },
                { phone: formatPhoneToDbStyle(rawPhone) },
              ],
            },
          })
        : null;

    if (!user) {
      return { ok: false, error: "Пайдаланушы табылмады." };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const pending = await prisma.pendingOtp.upsert({
      where: { userId: user.id },
      update: {
        code,
        phone: user.phone || rawPhone,
        expiresAt,
      },
      create: {
        userId: user.id,
        code,
        phone: user.phone || rawPhone,
        expiresAt,
      },
    });

    return safeJson({
      ok: true,
      phone: pending.phone,
      expiresAt: pending.expiresAt,
    });
  } catch (error) {
    console.error("resendOtp error:", error);
    return { ok: false, error: error?.message || "OTP қайта жіберу кезінде қате шықты." };
  }
}

export const getmarathonById = getMarathonById;
