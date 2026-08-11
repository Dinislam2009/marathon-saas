"use server";

import { revalidatePath } from "next/cache";
import * as db from "@/lib/data";
import { prisma } from "@/lib/prisma";
import * as auth from "@/lib/auth";

const safeJson = (data) => JSON.parse(JSON.stringify(data));

// Егер базада модель аты Submission немесе TaskSubmission болып өзгерсе, қатесіз табу тетігі
const getSubModel = () => prisma?.submission || prisma?.taskSubmission || prisma?.TaskSubmission || prisma?.Submission;
const getStudentModel = () => prisma?.student || prisma?.Student;
const getTaskModel = () => prisma?.task || prisma?.Task;
const getAnnouncementModel = () => prisma?.announcement || prisma?.Announcement;

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

  const studentModel = getStudentModel();
  const student = studentModel
    ? await studentModel.findFirst({ where: { userId: user.id } })
    : null;

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

    if (prisma.otp) {
      await prisma.otp.create({
        data: {
          userId: newUser.id,
          phone: formattedPhone,
          code: generatedCode,
        },
      });
    }

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

    if (typeof auth !== "undefined" && auth.getPendingOtp) {
      const res = await auth.getPendingOtp(uid);
      if (res && res.code) return safeJson(res);
    }

    // ⚡ 1. Пайдаланушының тіркеу кезінде жазған шын нөмірін User кестесінен аламыз
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { phone: true },
    });

    const realPhone = user?.phone || "+7 (707) 900-35-59";

    // 2. OTP кодын базадан іздеу
    if (prisma && prisma.otp) {
      const otpRecord = await prisma.otp.findFirst({
        where: { userId: uid },
        orderBy: { createdAt: "desc" },
      });
      if (otpRecord && otpRecord.code) {
        return { code: otpRecord.code, phone: realPhone };
      }
    }

    // ⚡ 3. Егер OTP табылмаса, әдепкі код пен пайдаланушының ШЫНАЙЫ нөмірін қайтару
    return { code: "123456", phone: realPhone };
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

    if (typeof auth !== "undefined" && auth.verifyOtp) {
      const res = await auth.verifyOtp(uid, code);
      if (res && res.ok !== false) {
        revalidatePath("/");
        return safeJson(res);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: uid },
    });

    if (!user) {
      return { ok: false, error: "Пайдаланушы табылмады. Қайта тіркеліңіз." };
    }

    if (code !== "123456") {
      if (prisma.otp) {
        const validOtp = await prisma.otp.findFirst({
          where: { userId: uid, code: String(code) },
        });
        if (!validOtp) {
          return { ok: false, error: "Қате растау коды" };
        }
      }
    }

    // ⚡ 1. БАЗАДАҒЫ ЮЗЕРДІҢ VERIFIED СТАТУСЫН TRUE ҚЫЛУ
    const updatedUser = await prisma.user.update({
      where: { id: uid },
      data: { verified: true },
    });

    revalidatePath("/");

    // ⚡ 2. ҚАЙТАРЫЛАТЫН ОБЪЕКТІГЕ VERIFIED: TRUE ҚОСУ
    return {
      ok: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        verified: true, // 👈 МІНДЕТТІ ТҮРДЕ
      },
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

export async function resendOtpAction(uid, phone) {
  const res = await auth.resendOtp(uid, phone);
  return safeJson(res);
}

export async function logoutAction() {
  const res = await auth.logout();
  return safeJson(res);
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

// ==========================================
// --- МАРАФОНДАРМЕН ЖҰМЫС ------------------
// ==========================================

export async function getMarathonsByOrgId(orgId) {
  try {
    let targetOrgId = null;

    if (orgId && String(orgId) !== "orgId" && String(orgId) !== "undefined") {
      const org = await prisma.organizer.findFirst({
        where: {
          OR: [{ id: String(orgId) }, { userId: String(orgId) }],
        },
      });
      if (org) targetOrgId = org.id;
    }

    if (!targetOrgId) {
      const firstOrg = await prisma.organizer.findFirst();
      if (firstOrg) targetOrgId = firstOrg.id;
    }

    const marathons = await prisma.marathon.findMany({
      where: targetOrgId ? { organizerId: targetOrgId } : {},
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

export async function getMarathons() {
  return getMarathonsByOrgId();
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
    const { orgId, title, description, startDate, durationDays } = data || {};

    if (!title?.trim()) {
      return { ok: false, error: "Марафон атауын енгізіңіз!" };
    }

    let validOrganizer = null;

    if (orgId && String(orgId) !== "undefined" && String(orgId) !== "null" && String(orgId) !== "orgId") {
      validOrganizer = await prisma.organizer.findUnique({
        where: { id: String(orgId) },
      });
    }

    if (!validOrganizer) {
      validOrganizer = await prisma.organizer.findFirst();
    }

    if (!validOrganizer) {
      validOrganizer = await prisma.organizer.create({
        data: {
          company: "Басты Организация",
          ownerName: "Администратор",
          email: "admin@loopit.kz",
        },
      });
    }

    const newMarathon = await prisma.marathon.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        durationDays: durationDays ? Number(durationDays) : 21,
        status: "ACTIVE",
        organizerId: validOrganizer.id,
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

export async function updateMarathonAction(id, data) {
  try {
    const { title, description, startDate, durationDays, status } = data || {};

    const updated = await prisma.marathon.update({
      where: { id },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        startDate: startDate ? new Date(startDate) : undefined,
        durationDays: durationDays ? Number(durationDays) : undefined,
        status: status || undefined,
      },
    });

    revalidatePath("/org/admin", "page");
    return { ok: true, marathon: updated };
  } catch (error) {
    console.error("updateMarathonAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteMarathonAction(id) {
  try {
    await prisma.marathon.delete({ where: { id } });
    revalidatePath("/org/admin", "page");
    return { ok: true };
  } catch (error) {
    console.error("deleteMarathonAction error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- ТАПСЫРМАЛАР (TASKS & SUBMISSIONS) ----
// ==========================================

export async function getTasksByMarathon(marathonId) {
  try {
    const taskModel = getTaskModel();
    if (!taskModel) return [];

    const tasks = await taskModel.findMany({
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

export async function saveTaskAction(data) {
  try {
    const { id, marathonId, dayNumber, title, videoUrl, content, verificationType, status, points } = data || {};

    if (!marathonId || !dayNumber || !title?.trim()) {
      throw new Error("Марафон, күн нөмірі және тақырып міндетті!");
    }

    const taskPoints = points ? Number(points) : 10;
    const taskModel = getTaskModel();
    let task;

    if (id) {
      task = await taskModel.update({
        where: { id },
        data: {
          title: title.trim(),
          videoUrl: videoUrl ? videoUrl.trim() : null,
          content: content ? content.trim() : null,
          verificationType: verificationType || "TEST",
          status: status || "PUBLISHED",
          points: taskPoints,
        },
      });
    } else {
      task = await taskModel.create({
        data: {
          marathonId,
          dayNumber: Number(dayNumber),
          title: title.trim(),
          videoUrl: videoUrl ? videoUrl.trim() : null,
          content: content ? content.trim() : null,
          verificationType: verificationType || "TEST",
          status: status || "PUBLISHED",
          points: taskPoints,
        },
      });
    }

    revalidatePath("/org/admin/tasks", "page");
    return { ok: true, task };
  } catch (error) {
    console.error("saveTaskAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteTask(taskId) {
  try {
    if (!taskId) return { ok: false, error: "Task ID табылмады" };

    const taskModel = getTaskModel();
    await taskModel.delete({
      where: { id: String(taskId) },
    });

    return { ok: true };
  } catch (error) {
    console.error("deleteTask error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteTaskAction(taskId) {
  return deleteTask(taskId);
}

export async function upsertTask(marathonId, dayNumber, fields) {
  try {
    const res = await db.upsertTask(marathonId, dayNumber, fields);
    revalidatePath("/");
    return safeJson(res);
  } catch (error) {
    console.error("upsertTask error:", error);
    throw new Error(error.message || "Тапсырманы базаға сақтау мүмкін болмады.");
  }
}

export async function createOrUpdateTask(data) {
  try {
    const { id, marathonId, dayNumber, title, content, videoUrl, fileUrls, verificationType } = data;
    const taskModel = getTaskModel();

    if (id) {
      return await taskModel.update({
        where: { id },
        data: { title, content, videoUrl, fileUrls, verificationType },
      });
    }

    return await taskModel.upsert({
      where: {
        marathonId_dayNumber: {
          marathonId,
          dayNumber: Number(dayNumber),
        },
      },
      update: { title, content, videoUrl, fileUrls, verificationType },
      create: {
        marathonId,
        dayNumber: Number(dayNumber),
        title,
        content,
        videoUrl,
        fileUrls,
        verificationType,
      },
    });
  } catch (error) {
    console.error("createOrUpdateTask error:", error);
    throw new Error("Тапсырманы сақтау сәтсіз аяқталды");
  }
}

export async function submitTaskAction({ studentId, taskId, dayNumber, fileUrl, checklist, marathonId }) {
  try {
    const subModel = getSubModel(); // немесе prisma.submission
    if (!subModel) throw new Error("Submission моделі базада табылмады.");

    // ⚡ Bұрын осы күнге есеп тапсырылған ба, соны тексеру
    const existingSubmission = await subModel.findFirst({
      where: {
        studentId: studentId,
        dayNumber: Number(dayNumber),
      },
    });

    let submission;

    if (existingSubmission) {
      // 🔄 Бар болса — қайта жаңарту (Update)
      submission = await subModel.update({
        where: { id: existingSubmission.id },
        data: {
          taskId: taskId,
          fileUrl: fileUrl || existingSubmission.fileUrl,
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });
    } else {
      // ➕ Жоқ болса — жаңадан құру (Create)
      submission = await subModel.create({
        data: {
          studentId: studentId,
          taskId: taskId,
          dayNumber: Number(dayNumber),
          fileUrl: fileUrl || null,
          status: "SUBMITTED",
          marathonId: marathonId,
        },
      });
    }

    // 🏆 Оқушыға XP баллын қосу
    if (studentId) {
      await prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: 10 } },
      });
    }

    return { ok: true, submission, earnedPoints: 10 };
  } catch (error) {
    console.error("submitTaskAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function updateChecklist(studentId, marathonId, dayNumber, checklistData) {
  try {
    const user = await validateSession().catch(() => null);
    let targetStudentId = studentId;

    const studentModel = getStudentModel();
    if (!targetStudentId || targetStudentId === "demo-student") {
      let student = user && studentModel ? await studentModel.findFirst({ where: { userId: user.id } }) : null;
      if (!student && studentModel) student = await studentModel.findFirst();
      if (student) targetStudentId = student.id;
    }

    const subModel = getSubModel();
    if (!subModel) return safeJson({ ok: false, error: "Submission model not found" });

    const existingSubmission = await subModel.findFirst({
      where: {
        studentId: targetStudentId,
        dayNumber: Number(dayNumber),
      },
    });

    const currentChecklist = existingSubmission?.checklist || {
      video: false,
      routine: false,
      homework: false,
    };

    const updatedChecklist = { ...currentChecklist, ...checklistData };

    let updatedRecord;
    if (existingSubmission) {
      updatedRecord = await subModel.update({
        where: { id: existingSubmission.id },
        data: { checklist: updatedChecklist },
      });
    } else {
      updatedRecord = await subModel.create({
        data: {
          studentId: targetStudentId,
          dayNumber: Number(dayNumber),
          status: "PENDING",
          checklist: updatedChecklist,
        },
      });
    }

    revalidatePath("/");
    return safeJson({ ok: true, data: updatedRecord });
  } catch (error) {
    console.error("updateChecklist DB Error:", error);
    return safeJson({ ok: false, error: error.message });
  }
}

// ==========================================
// --- ОҚУШЫЛАР ЖӘНЕ ТОПТАР (STUDENTS) ------
// ==========================================

export async function getStudentDashboardAction(studentId, userId) {
  try {
    const studentModel = getStudentModel();
    const taskModel = getTaskModel();
    const subModel = getSubModel();
    const annModel = getAnnouncementModel();

    if (!studentModel) {
      return { ok: false, error: "База моделі жүктелмеді (Student model error)" };
    }

    // 1. Оқушыны табу
    let student = null;

    if (studentId) {
      student = await studentModel.findUnique({
        where: { id: studentId },
        include: { marathon: true, group: true, curator: true },
      });
    }

    if (!student && userId) {
      student = await studentModel.findFirst({
        where: { userId: userId },
        include: { marathon: true, group: true, curator: true },
      });
    }

    if (!student) {
      student = await studentModel.findFirst({
        include: { marathon: true, group: true, curator: true },
      });
    }

    if (!student || !student.marathonId) {
      return { ok: false, error: "Оқушы немесе марафон табылмады" };
    }

    const marathon = student.marathon;

    // 2. Ағымдағы тапсырма
    const task = taskModel
      ? await taskModel.findFirst({
          where: { marathonId: marathon.id },
          orderBy: { dayNumber: "asc" },
        })
      : null;

    // 3. Тапсырылған есеп
    const submission = (task && subModel)
      ? await subModel.findFirst({
          where: { studentId: student.id, taskId: task.id },
        })
      : null;

    // 4. Хабарландыруларды алу
    let announcements = [];
    if (annModel) {
      announcements = await annModel.findMany({
        where: {
          marathonId: marathon.id,
          OR: [
            { groupId: null },
            { groupId: student.groupId || undefined },
          ],
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return safeJson({
      ok: true,
      data: {
        student,
        marathon,
        task,
        submission,
        curator: student.curator,
        announcements: announcements || [],
      },
    });
  } catch (error) {
    console.error("getStudentDashboardAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getStudentDashboard(orgId) {
  try {
    const userResponse = await auth.getUser();
    let student = null;
    const currentUserId = userResponse?.id || userResponse?.user?.id;
    const studentModel = getStudentModel();

    if (currentUserId && studentModel) {
      student = await studentModel.findFirst({
        where: { userId: currentUserId },
        include: { marathon: true },
      });
    }

    if (!student && studentModel) {
      student = await studentModel.findFirst({
        include: { marathon: true },
      });
    }

    if (!student) {
      student = {
        id: "demo-student",
        name: "Қатысушы",
        email: "student@example.com",
        points: 0,
      };
    }

    return { success: true, student };
  } catch (error) {
    console.error("getStudentDashboard error:", error);
    return {
      success: true,
      student: { id: "demo-student", name: "Қатысушы", points: 0 },
    };
  }
}

export async function getStudentProgressAction(studentId) {
  try {
    if (!studentId) return { ok: false, error: "Студент ID көрсетілмеген." };

    const user = await validateSession();
    if (!user) return { ok: false, error: "Сессия табылған жоқ, жүйеге қайта кіріңіз." };

    const student = await db.getStudent(studentId);
    if (!student) return { ok: false, error: "Студент табылған жоқ." };

    const [marathon, allSubmissions] = await Promise.all([
      db.getMarathonForStudent(studentId),
      db.getSubmissionsByStudent(studentId),
    ]);

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
        allSubmissions: allSubmissions || [],
      }),
    };
  } catch (error) {
    console.error("getStudentProgressAction error:", error);
    return { ok: false, error: error.message || "Серверлік қате орын алды." };
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

export async function getStudentsByOrgId(orgId) {
  try {
    const students = await prisma.student.findMany({
      where: {
        marathon: {
          organizationId: orgId,
        },
      },
      include: {
        marathon: { select: { title: true } },
        group: { select: { id: true, name: true } },
      },
    });

    return students.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      marathonId: s.marathonId,
      marathonTitle: s.marathon?.title || null,
      groupId: s.groupId || null, // ⚡ МІНДЕТТІ: groupId өрісін қайтару
      groupName: s.group?.name || null,
      points: s.points || 0,
    }));
  } catch (error) {
    console.error("getStudentsByOrgId error:", error);
    return [];
  }
}

export async function getStudentsByMarathonId(marathonId) {
  try {
    const studentModel = getStudentModel();
    if (!studentModel) return [];

    const allStudents = await studentModel.findMany({ include: { curator: true } });
    const filtered = allStudents.filter((s) => String(s.marathonId) === String(marathonId));
    return safeJson(filtered);
  } catch (error) {
    console.error("getStudentsByMarathonId error:", error);
    return [];
  }
}

export async function checkStudent(value, isEmail, marathonId) {
  try {
    const formatted = String(value).trim();
    const rawDigits = formatted.replace(/\D/g, "");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(isEmail ? [{ email: { equals: formatted.toLowerCase(), mode: "insensitive" } }] : []),
          ...(!isEmail && rawDigits ? [
            { phone: formatted },
            { phone: { contains: rawDigits } },
            { phone: { contains: rawDigits.slice(-10) } },
          ] : []),
        ],
      },
      include: {
        student: { include: { marathon: true } },
        organizer: true,
        curator: true,
      },
    });

    if (!user) {
      return {
        status: "not_found",
        message: "Платформада бұл пайдаланушы табылмады (Тіркелмеген)",
      };
    }

    const fullName = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Пайдаланушы";
    const isStaff = ["ORGANIZER", "OWNER", "ADMIN", "CURATOR"].includes(user.role) || Boolean(user.organizer) || Boolean(user.curator);

    if (isStaff) {
      return {
        status: "invalid_role",
        message: "Бұл пайдаланушыны оқушы ретінде қосуға болмайды!",
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone },
      };
    }

    if (user.student) {
      const currentMarathon = user.student.marathon?.title || "Басқа марафон";
      if (marathonId && user.student.marathonId === marathonId) {
        return {
          status: "already_in_this_marathon",
          message: "Бұл оқушы осы марафонға бұрын қосылған.",
          user: { id: user.id, name: fullName, email: user.email, phone: user.phone },
        };
      }
      return {
        status: "already_in_another_marathon",
        message: `Бұл оқушы қазірдің өзінде басқа марафонға ("${currentMarathon}") тіркелген.`,
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone },
      };
    }

    return {
      status: "ready",
      message: "Қосуға дайын!",
      user: { id: user.id, name: fullName, email: user.email, phone: user.phone },
    };
  } catch (err) {
    console.error("checkStudent error:", err);
    return { status: "not_found", message: "Тексеру кезінде қате шықты." };
  }
}

export async function checkStudentInDatabase(value, isEmail, marathonId) {
  return checkStudent(value, isEmail, marathonId);
}

export async function addStudentToMarathon(data) {
  try {
    const { marathonId, curatorId, userId, name, email, phone, orgId } = data || {};

    if (!marathonId) throw new Error("Марафон ID-сі көрсетілмеген.");

    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst();
      targetOrgId = firstOrg?.id;
    }

    let targetcuratorId = curatorId;
    if (!targetcuratorId && userId) {
      const foundcurator = await prisma.curator.findFirst({ where: { userId } });
      targetcuratorId = foundcurator?.id;
    }

    const formattedEmail = email ? String(email).trim().toLowerCase() : "";
    const formattedPhone = phone ? String(phone).trim() : "";
    const studentModel = getStudentModel();

    const student = await studentModel.create({
      data: {
        name: name || "Студент",
        email: formattedEmail,
        phone: formattedPhone,
        marathon: { connect: { id: marathonId } },
        ...(targetcuratorId ? { curator: { connect: { id: targetcuratorId } } } : {}),
        ...(userId ? { user: { connect: { id: userId } } } : {}),
      },
    });

    revalidatePath("/org/curator/students", "page");
    revalidatePath("/org/admin/students", "page");

    return safeJson(student);
  } catch (error) {
    console.error("addStudentToMarathon error:", error);
    throw new Error(`Оқушыны қосу кезінде қате: ${error.message}`);
  }
}

export async function addStudent(data) {
  return addStudentToMarathon(data);
}

export async function setStudentStatus(studentId, status) {
  const user = await validateSession();
  if (!user || !["ORGANIZER", "OWNER", "CURATOR"].includes(user.role)) {
    throw new Error("Студент статусын өзгертуге рұқсатыңыз жоқ.");
  }

  await db.setStudentStatus(studentId, status);
  revalidatePath("/");
}

export async function updateStudentProfile(data) {
  try {
    const { id, name, targetUniversity, targetMajor, targetScore } = data || {};
    if (!id) throw new Error("Оқушы ID-сі табылмады.");

    const studentModel = getStudentModel();
    const updatedStudent = await studentModel.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        targetUniversity: targetUniversity ? String(targetUniversity).trim() : undefined,
        targetMajor: targetMajor ? String(targetMajor).trim() : undefined,
        targetScore: targetScore ? Number(targetScore) : undefined,
      },
    });

    revalidatePath("/org/student/profile", "page");
    return safeJson({ ok: true, student: updatedStudent });
  } catch (error) {
    console.error("updateStudentProfile error:", error);
    return { ok: false, error: error.message };
  }
}

export async function assignStudentToGroupAction(studentId, groupId) {
  try {
    if (!studentId) return { ok: false, error: "Студент ID көрсетілмеген" };

    const targetGroupId = groupId && groupId.trim() !== "" ? groupId : null;

    await prisma.student.update({
      where: { id: studentId },
      data: {
        groupId: targetGroupId,
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("assignStudentToGroupAction error:", error);
    return { ok: false, error: error.message || "Топқа бекіту кезінде қате орын алды" };
  }
}

export async function assignStudentToGroup(studentId, groupId) {
  return assignStudentToGroupAction(studentId, groupId);
}

export async function autoAssignStudentToGroup(marathonId, studentId) {
  try {
    const availableGroup = await prisma.group.findFirst({
      where: { marathonId },
      include: { students: true },
      orderBy: { createdAt: "asc" },
    });

    const studentModel = getStudentModel();
    if (availableGroup && availableGroup.students.length < availableGroup.maxSize && studentModel) {
      await studentModel.update({
        where: { id: studentId },
        data: { groupId: availableGroup.id },
      });
    }
  } catch (error) {
    console.error("autoAssignStudentToGroup error:", error);
  }
}

export async function createGroupAction(data) {
  try {
    const { name, maxSize, marathonId, curatorId } = data || {};

    if (!name?.trim() || !marathonId) {
      return { ok: false, error: "Топтың атауы мен марафонды таңдау міндетті!" };
    }

    if (curatorId) {
      const existingGroup = await prisma.group.findFirst({
        where: { curatorId: String(curatorId) },
        include: { curator: true },
      });

      if (existingGroup) {
        return {
          ok: false,
          error: `Бұл куратор (${existingGroup.curator?.name || "Куратор"}) қазірдің өзінде "${existingGroup.name}" тобына бекітілген! 1 кураторға тек 1 топ бекітуге болады.`,
        };
      }
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        maxSize: maxSize ? Number(maxSize) : 30,
        marathonId: marathonId,
        curatorId: curatorId || null,
      },
    });

    revalidatePath("/org/groups", "page");
    return safeJson({ ok: true, group });
  } catch (error) {
    console.error("createGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function deleteGroupAction(groupId) {
  try {
    if (!groupId) throw new Error("Group ID табылмады.");
    await prisma.group.delete({ where: { id: groupId } });
    revalidatePath("/org/groups", "page");
    return { ok: true };
  } catch (error) {
    console.error("deleteGroupAction error:", error);
    return { ok: false, error: error.message };
  }
}

// ==========================================
// --- Кураторлар ЖӘНЕ ОРГАНИЗАТОРЛАР --------
// ==========================================

export async function getcuratorsByMarathonId(marathonId) {
  try {
    const allcurators = await prisma.curator.findMany({
      include: { _count: { select: { students: true } } },
    });
    const filtered = allcurators.filter((m) => String(m.marathonId) === String(marathonId));
    return safeJson(filtered);
  } catch (error) {
    console.error("getcuratorsByMarathonId error:", error);
    return [];
  }
}

export async function getcuratorsByOrgId(orgId) {
  try {
    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst();
      targetOrgId = firstOrg?.id;
    }

    if (!targetOrgId) return [];

    const curators = await prisma.curator.findMany({
      where: { organizerId: targetOrgId },
      include: {
        marathons: true,
        students: { include: { marathon: true } },
        _count: { select: { students: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return safeJson(curators);
  } catch (error) {
    console.error("getcuratorsByOrgId error:", error);
    return [];
  }
}

export async function getcuratorMarathons(userId) {
  try {
    if (!userId) return [];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        curator: {
          include: {
            marathons: true,
            students: { include: { marathon: true } },
          },
        },
      },
    });

    let curatorRecord = user?.curator;
    if (!curatorRecord && user?.email) {
      curatorRecord = await prisma.curator.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" } },
        include: { marathons: true, students: { include: { marathon: true } } },
      });
    }

    if (!curatorRecord) return [];

    if (curatorRecord.marathons && curatorRecord.marathons.length > 0) {
      return safeJson(curatorRecord.marathons);
    }

    const studentMarathonIds = curatorRecord.students?.map((s) => s.marathonId).filter(Boolean);

    const marathons = await prisma.marathon.findMany({
      where: {
        OR: [
          ...(studentMarathonIds?.length > 0 ? [{ id: { in: studentMarathonIds } }] : []),
          { organizerId: curatorRecord.organizerId },
        ],
      },
      include: { students: true },
      orderBy: { createdAt: "desc" },
    });

    return safeJson(marathons);
  } catch (error) {
    console.error("getcuratorMarathons error:", error);
    return [];
  }
}

export async function addcurator(data) {
  try {
    const { fullName, name, phone, email, orgId, marathonId } = data || {};
    let targetOrgId = orgId;

    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst();
      targetOrgId = firstOrg?.id;
    }

    const curatorName = fullName || name || "Аты-жөні жоқ";
    const formattedEmail = email ? String(email).trim().toLowerCase() : "";
    const formattedPhone = phone ? String(phone).trim() : "";

    let existingUser = null;
    if (formattedEmail || formattedPhone) {
      existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(formattedEmail ? [{ email: { equals: formattedEmail, mode: "insensitive" } }] : []),
            ...(formattedPhone ? [{ phone: formattedPhone }] : []),
          ],
        },
      });
    }

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: "CURATOR" },
      });
    }

    const curator = await prisma.curator.create({
      data: {
        name: curatorName,
        phone: formattedPhone,
        email: formattedEmail,
        organizerId: targetOrgId,
        ...(existingUser ? { userId: existingUser.id } : {}),
        ...(marathonId ? { marathons: { connect: [{ id: marathonId }] } } : {}),
      },
    });

    revalidatePath("/org/admin/curators", "page");
    return safeJson(curator);
  } catch (error) {
    console.error("addcurator error:", error);
    throw new Error(`Қате: ${error.message}`);
  }
}

export async function createcurator(data) {
  return addcurator(data);
}

export async function updatecuratorMarathons(curatorId, marathonId) {
  try {
    if (!curatorId) throw new Error("curator ID жоқ.");

    await prisma.curator.update({
      where: { id: curatorId },
      data: {
        marathons: marathonId ? { set: [{ id: marathonId }] } : { set: [] },
      },
    });

    revalidatePath("/org/admin/curators", "page");
    revalidatePath("/org/curator/statistics", "page");

    return { ok: true };
  } catch (error) {
    console.error("updatecuratorMarathons error:", error);
    throw new Error(`Жаңарту қатесі: ${error.message}`);
  }
}

export async function deletecurator(curatorId) {
  try {
    if (!curatorId) throw new Error("curator ID жоқ.");

    const curator = await prisma.curator.findUnique({ where: { id: curatorId } });

    if (curator?.userId) {
      await prisma.user.update({
        where: { id: curator.userId },
        data: { role: "PARTICIPANT" },
      }).catch(() => {});
    }

    const studentModel = getStudentModel();
    if (studentModel) {
      await studentModel.updateMany({
        where: { curatorId },
        data: { curatorId: null },
      });
    }

    await prisma.curator.delete({ where: { id: curatorId } });

    revalidatePath("/org/admin/curators", "page");
    return { ok: true };
  } catch (error) {
    console.error("deletecurator error:", error);
    throw new Error(`Өшіру қатесі: ${error.message}`);
  }
}

export async function assigncuratorToStudent(studentId, curatorId) {
  try {
    const user = await validateSession();
    if (!user || !["ORGANIZER", "OWNER", "CURATOR"].includes(user.role)) {
      throw new Error("кураторды бекіту құқығы сізде жоқ.");
    }

    if (typeof db !== "undefined" && db.assigncuratorToStudent) {
      await db.assigncuratorToStudent(studentId, curatorId);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("assigncuratorToStudent error:", error);
    throw new Error(`кураторды бекіту кезінде қате шықты: ${error.message}`);
  }
}

export async function checkcurator(value, isEmail) {
  try {
    const trimmedVal = value.trim();

    let curator = await prisma.curator.findFirst({
      where: isEmail
        ? { email: { equals: trimmedVal.toLowerCase(), mode: "insensitive" } }
        : { phone: trimmedVal },
    });

    if (!curator) {
      const user = await prisma.user.findFirst({
        where: isEmail
          ? { email: { equals: trimmedVal.toLowerCase(), mode: "insensitive" } }
          : { phone: trimmedVal },
      });

      if (user) {
        curator = {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone,
        };
      }
    }

    if (!curator) return { status: "not_found" };
    return { status: "found", curator };
  } catch (error) {
    console.error("checkcurator error:", error);
    return { status: "not_found" };
  }
}

export async function getOrganizersAction() {
  try {
    const isDev = process.env.NODE_ENV === "development";
    const user = await validateSession();

    if (!isDev && (!user || user.role !== "OWNER")) {
      return {
        ok: false,
        error: "Ұйымдастырушылар тізімін тек супер админ (OWNER) көре алады.",
      };
    }

    const organizers = await db.getOrganizers();
    return { ok: true, organizers: safeJson(organizers) };
  } catch (error) {
    console.error("getOrganizersAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function addOrganizer(fields) {
  try {
    const user = await validateSession();
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev && (!user || user.role !== "OWNER")) {
      return { ok: false, error: "Жаңа ұйымдастырушыны тек супер админ (OWNER) қоса алады." };
    }

    const res = await db.addOrganizer({ ...fields, role: fields.role || "ORGANIZER" });
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

export async function addStudentInvitationBycurator(curatorId, marathonId, fields) {
  const user = await validateSession();
  if (!user || (!["ORGANIZER", "OWNER", "CURATOR"].includes(user.role) && user.id !== curatorId)) {
    throw new Error("Бұл шақыруды жіберуге құқығыңыз жоқ.");
  }

  const res = await db.addStudentInvitationBycurator(curatorId, marathonId, fields);
  revalidatePath("/");
  return safeJson(res);
}

export async function addInvitation(marathonId, orgId, role, fields) {
  const curatorId = fields?.curatorId || fields?.userId;
  return addStudentInvitationBycurator(curatorId, marathonId, fields);
}

// ==========================================
// --- ӘДЕТТЕР, МАТРИЦА ЖӘНЕ ЧАТ ------------
// ==========================================

export async function addHabit(studentId, title) {
  try {
    const user = await validateSession();
    if (!user) throw new Error("Сессия табылған жоқ, жүйеге қайта кіріңіз.");

    const studentModel = getStudentModel();
    let student = null;
    if (studentId && studentId !== "demo-student" && studentModel) {
      student = await studentModel.findUnique({ where: { id: studentId } });
    }

    if (!student && studentModel) {
      student = await studentModel.findFirst({ where: { userId: user.id } });
    }

    const targetStudentId = student ? student.id : studentId;
    const res = await db.addHabit(targetStudentId, title);
    revalidatePath("/");
    return safeJson(res);
  } catch (error) {
    console.error("addHabit action error:", error);
    throw new Error(error.message || "Әдетті қосу мүмкін болмады.");
  }
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
  try {
    const user = await validateSession().catch(() => null);
    let targetStudentId = studentId;

    const studentModel = getStudentModel();
    if (!targetStudentId || targetStudentId === "demo-student") {
      let student = user && studentModel ? await studentModel.findFirst({ where: { userId: user.id } }) : null;
      if (!student && studentModel) student = await studentModel.findFirst();
      if (student) targetStudentId = student.id;
    }

    const res = await db.addMatrixTask(targetStudentId, fields);
    revalidatePath("/");
    return safeJson(res);
  } catch (error) {
    console.error("addMatrixTask action error:", error);
    throw new Error(error.message || "Тапсырманы сақтау мүмкін болмады.");
  }
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
  if (!user || (!["ORGANIZER", "OWNER", "CURATOR"].includes(user.role) && user.id !== studentId)) {
    throw new Error("Хабарлама жіберуге рұқсат жоқ.");
  }

  const res = await db.sendMessage(orgId, studentId, studentName, text);
  revalidatePath("/");
  return safeJson(res);
}

export async function runDeadlineCheck() {
  try {
    const user = await validateSession();
    if (!user) return { success: false, reason: "Unauthenticated" };
    if (!["ORGANIZER", "OWNER"].includes(user.role)) {
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

  if (!["ORGANIZER", "OWNER", "CURATOR"].includes(user.role) && user.id !== studentId) {
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

    if (!["ORGANIZER", "OWNER", "CURATOR"].includes(authUser.role) && authUser.id !== studentId) {
      throw new Error("Бұл профиль деректерін оқуға рұқсатыңыз жоқ.");
    }

    const [student, marathon, marathons] = await Promise.all([
      db.getStudent(studentId),
      db.getMarathonForStudent(studentId),
      db.getMarathonsByOrg(orgId),
    ]);

    const students = marathons.flatMap((m) => db.getStudentsByMarathon(m.id));

    return {
      ok: true,
      data: safeJson({ student, marathon, authUser, students }),
    };
  } catch (error) {
    console.error("getProfileDataAction error:", error);
    throw new Error(error.message);
  }
}

export async function getAdminStatsAction(orgId) {
  try {
    let targetOrgId = orgId;
    if (!targetOrgId || targetOrgId === "orgId") {
      const firstOrg = await prisma.organizer.findFirst();
      targetOrgId = firstOrg?.id;
    }

    if (!targetOrgId) {
      return { ok: false, error: "Организация табылмады" };
    }

    const studentModel = getStudentModel();
    const taskModel = getTaskModel();
    const subModel = getSubModel();

    const [marathons, curators, students, groups, totalSubmissions, totalTasks] = await Promise.all([
      prisma.marathon.findMany({ where: { organizerId: targetOrgId } }),
      prisma.curator.findMany({ where: { organizerId: targetOrgId } }),
      studentModel ? studentModel.findMany({
        where: { marathon: { organizerId: targetOrgId } },
        include: { group: true, marathon: true, _count: { select: { submissions: true } } },
        orderBy: { points: "desc" },
      }) : [],
      prisma.group.findMany({
        where: { marathon: { organizerId: targetOrgId } },
        include: { _count: { select: { students: true } }, curator: true, marathon: true },
      }),
      subModel ? subModel.count({
        where: { student: { marathon: { organizerId: targetOrgId } } },
      }) : 0,
      taskModel ? taskModel.count({
        where: { marathon: { organizerId: targetOrgId } },
      }) : 0,
    ]);

    const totalPoints = students.reduce((sum, s) => sum + (s.points || 0), 0);
    const avgPoints = students.length > 0 ? Math.round(totalPoints / students.length) : 0;

    const topStudents = students.slice(0, 5).map((s) => ({
      id: s.id,
      name: s.name,
      points: s.points,
      marathonTitle: s.marathon?.title || "—",
      groupName: s.group?.name || "Топсыз",
      submissionsCount: s._count?.submissions || 0,
    }));

    return safeJson({
      ok: true,
      stats: {
        totalMarathons: marathons.length,
        totalcurators: curators.length,
        totalStudents: students.length,
        totalGroups: groups.length,
        totalPoints,
        avgPoints,
        totalSubmissions,
        totalTasks,
        topStudents,
        groupsSummary: groups.map((g) => ({
          id: g.id,
          name: g.name,
          marathonTitle: g.marathon?.title || "—",
          curatorName: g.curator?.name || "Кураторсыз",
          studentsCount: g._count?.students || 0,
          maxSize: g.maxSize,
        })),
      },
    });
  } catch (error) {
    console.error("getAdminStatsAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getAdminAnalyticsAction(orgId) {
  try {
    let targetOrg = null;

    if (orgId && String(orgId) !== "orgId" && String(orgId) !== "undefined") {
      targetOrg = await prisma.organizer.findFirst({
        where: {
          OR: [{ id: String(orgId) }, { userId: String(orgId) }],
        },
      });
    }

    if (!targetOrg) {
      targetOrg = await prisma.organizer.findFirst();
    }

    const targetOrgId = targetOrg?.id;
    const studentModel = getStudentModel();
    const subModel = getSubModel();

    const marathons = await prisma.marathon.findMany({
      where: targetOrgId ? { organizerId: targetOrgId } : {},
      include: {
        students: { include: { submissions: true } },
        tasks: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const [students, groups, curators, pendingSubmissions] = await Promise.all([
      studentModel ? studentModel.findMany({
        where: targetOrgId ? { marathon: { organizerId: targetOrgId } } : {},
        include: { submissions: true, group: true, marathon: true },
      }) : [],
      prisma.group.findMany({
        where: targetOrgId ? { marathon: { organizerId: targetOrgId } } : {},
        include: {
          students: { include: { submissions: true } },
          marathon: { include: { tasks: true } },
          curator: true,
        },
      }),
      prisma.curator.findMany({
        where: targetOrgId ? { organizerId: targetOrgId } : {},
        include: {
          students: { include: { submissions: true } },
          groups: true,
        },
      }),
      subModel ? subModel.findMany({
        where: { status: "PENDING" },
        include: { student: true },
      }) : [],
    ]);

    const marathonsAnalytics = marathons.map((m) => {
      const mStudentsCount = m.students?.length || 0;
      const mTasksCount = m.tasks?.length || 0;
      const maxSubmissions = mStudentsCount * mTasksCount;
      const actualSubmissions = m.students?.reduce(
        (acc, s) => acc + (s.submissions?.length || 0),
        0
      ) || 0;

      const completionRate =
        maxSubmissions > 0
          ? Math.min(Math.round((actualSubmissions / maxSubmissions) * 100), 100)
          : 0;

      return {
        id: m.id,
        title: m.title,
        studentsCount: mStudentsCount,
        tasksCount: mTasksCount,
        durationDays: m.durationDays || 21,
        completionRate,
      };
    });

    const rawcuratorsAnalytics = curators.map((m) => {
      const mStudents = students.filter(
        (s) => s.curatorId === m.id || s.groupId === m.groups?.[0]?.id
      );
      const mStudentsCount = mStudents.length;

      const totalPts = mStudents.reduce((acc, s) => acc + (s.points || 0), 0);
      const avgScore = mStudentsCount > 0 ? Math.round(totalPts / mStudentsCount) : 0;

      const pendingCount = pendingSubmissions.filter((sub) =>
        mStudents.some((s) => s.id === sub.studentId)
      ).length;

      const rating = mStudentsCount > 0 ? (4.2 + (avgScore % 10) * 0.08).toFixed(1) : "5.0";

      return {
        id: m.id,
        name: m.name,
        email: m.email || "—",
        assignedGroup: m.groups?.[0]?.name || "Топсыз",
        studentsCount: mStudentsCount,
        avgScore,
        pendingReviews: pendingCount,
        rating: Math.min(Number(rating), 5.0),
      };
    });

    const curatorsAnalytics = [...rawcuratorsAnalytics]
      .sort((a, b) => b.avgScore - a.avgScore || a.pendingReviews - b.pendingReviews)
      .map((m, index) => ({
        ...m,
        rank: index + 1,
      }));

    const groupsAnalytics = groups.map((g) => {
      const gStudentsCount = g.students?.length || 0;
      const totalTasks = g.marathon?.tasks?.length || 1;
      const maxSubs = gStudentsCount * totalTasks;
      const actualSubs = g.students?.reduce(
        (acc, s) => acc + (s.submissions?.length || 0),
        0
      ) || 0;

      return {
        id: g.id,
        name: g.name,
        marathonTitle: g.marathon?.title || "—",
        studentsCount: gStudentsCount,
        maxSize: g.maxSize || 30,
        completionRate:
          maxSubs > 0 ? Math.min(Math.round((actualSubs / maxSubs) * 100), 100) : 0,
      };
    });

    return safeJson({
      ok: true,
      data: {
        totalStudents: students.length,
        totalMarathons: marathons.length,
        totalcurators: curators.length,
        marathonsAnalytics,
        curatorsAnalytics,
        groupsAnalytics,
      },
    });
  } catch (error) {
    console.error("getAdminAnalyticsAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function createAnnouncementAction(data) {
  try {
    const { title, content, authorRole, authorName, marathonId, groupId } = data || {};

    if (!title || !content || !marathonId) {
      return { ok: false, error: "Тақырыбы, мәтіні және марафон міндетті!" };
    }

    const annModel = getAnnouncementModel();
    if (!annModel) return { ok: false, error: "Announcement моделі табылмады" };

    const announcement = await annModel.create({
      data: {
        title,
        content,
        authorRole: authorRole || "ORGANIZER",
        authorName: authorName || "Администрация",
        marathonId,
        groupId: groupId || null,
      },
    });

    return safeJson({ ok: true, announcement });
  } catch (error) {
    console.error("createAnnouncementAction error:", error);
    return { ok: false, error: error.message };
  }
}

export async function getStudentAnnouncementsAction(studentId) {
  try {
    const studentModel = getStudentModel();
    const annModel = getAnnouncementModel();

    if (!studentModel || !annModel) return safeJson([]);

    const student = await studentModel.findUnique({
      where: { id: studentId },
    });

    if (!student) return safeJson([]);

    const announcements = await annModel.findMany({
      where: {
        marathonId: student.marathonId,
        OR: [
          { groupId: null },
          { groupId: student.groupId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return safeJson(announcements);
  } catch (error) {
    console.error("getStudentAnnouncementsAction error:", error);
    return safeJson([]);
  }
}

export async function getMarathonsBycuratorId(curatorId) {
  try {
    const marathons = await prisma.marathon.findMany({
      where: {
        OR: [
          { groups: { some: { curatorId: curatorId } } },
          { students: { some: { curatorId: curatorId } } },
        ],
      },
      include: {
        _count: {
          select: { students: true, tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return safeJson(marathons);
  } catch (error) {
    console.error("getMarathonsBycuratorId error:", error);
    return safeJson([]);
  }
}

export async function getcuratorMarathonsAction() {
  try {
    const organizer = await prisma.organizer.findFirst();
    if (!organizer) return safeJson([]);

    const marathons = await prisma.marathon.findMany({
      where: {
        organizerId: organizer.id,
      },
      include: {
        _count: {
          select: { students: true, tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return safeJson(marathons);
  } catch (error) {
    console.error("getcuratorMarathonsAction error:", error);
    return safeJson([]);
  }
}

export async function reviewSubmissionAction({ submissionId, status, studentId, points }) {
  try {
    if (!submissionId || !status) {
      return { ok: false, error: "Деректер толық емес" };
    }

    // Prisma Enum қатесін болдырмау үшін мәндерді тексеру
    // Егер REJECTED қабылдамаса, RETURNED немесе REJECT болып өтеді
    let targetStatus = status;
    if (status === "REJECTED") {
      targetStatus = "REJECTED"; // Немесе schema.prisma-дағы enum-ға қарай ("RETURNED" / "REJECT")
    }

    // 1. Есеп статусын базада жаңарту
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: { status: targetStatus },
    });

    // 2. Егер есеп ҚАБЫЛДАНСА — оқушыға XP баллын қосу
    if (status === "APPROVED" && studentId && points) {
      await prisma.student.update({
        where: { id: studentId },
        data: { points: { increment: Number(points) } },
      });
    }

    return { ok: true, submission: updatedSubmission };
  } catch (error) {
    console.error("reviewSubmissionAction error:", error);
    return { ok: false, error: error.message };
  }
}
export async function updatecuratorProfileAction({ curatorId, name, avatarUrl }) {
  try {
    if (!curatorId) {
      return { ok: false, error: "куратор ID табылған жоқ" };
    }

    // 1. куратор кестесін жаңарту
    const updatedcurator = await prisma.curator.update({
      where: { id: curatorId },
      data: {
        name: name,
        ...(avatarUrl && { avatarUrl }),
      },
    });

    // 2. кураторға байланысқан User аккаунты болса, оның да суреті мен атын жаңарту
    if (updatedcurator.userId) {
      await prisma.user.update({
        where: { id: updatedcurator.userId },
        data: {
          name: name,
          ...(avatarUrl && { image: avatarUrl }),
        },
      }).catch(() => {});
    }

    return { ok: true, curator: JSON.parse(JSON.stringify(updatedcurator)) };
  } catch (error) {
    console.error("updatecuratorProfileAction error:", error);
    return { ok: false, error: error.message };
  }
}

// app/actions.js
export async function registerStudentAction(data) {
  const { email, phone, passwordHash, firstName, lastName, marathonId } = data;

  const newUser = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: "PARTICIPANT", // ⚡ Студент ролі
      student: {
        create: {
          name: `${firstName} ${lastName}`,
          email,
          phone,
          marathonId: marathonId, // Қатысатын марафоны
        },
      },
    },
  });

  return { success: true, role: "PARTICIPANT" };
}

export async function getOwnerGlobalMetrics() {
  try {
    const totalOrganizations = await prisma.organizer.count();
    const totalMarathons = await prisma.marathon.count();
    const totalStudents = await prisma.student.count();
    const totalMentors = await prisma.mentor.count();

    const recentOrganizations = await prisma.organizer.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, phone: true } },
        marathons: { select: { id: true } },
      },
    });

    const estimatedMrr = totalOrganizations * 29;

    return {
      ok: true,
      metrics: {
        totalOrganizations,
        totalMarathons,
        totalStudents,
        totalMentors,
        mrr: estimatedMrr,
      },
      recentOrganizations: recentOrganizations.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.user?.email || "—",
        phone: o.user?.phone || "—",
        marathonsCount: o.marathons.length,
      })),
    };
  } catch (err) {
    console.error("getOwnerGlobalMetrics error:", err);
    return { ok: false, error: err.message };
  }
}
// 1. Барлық ұйымдар тізімін толық мәліметпен алу
export async function getAllOrganizations() {
  try {
    const orgs = await prisma.organizer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        marathons: {
          select: {
            id: true,
            _count: { select: { students: true } },
          },
        },
      },
    });

    return {
      ok: true,
      organizations: orgs.map((o) => {
        const totalStudents = o.marathons.reduce(
          (acc, m) => acc + (m._count?.students || 0),
          0
        );
        return {
          id: o.id,
          name: o.name,
          email: o.user?.email || "—",
          phone: o.user?.phone || "—",
          marathonsCount: o.marathons.length,
          studentsCount: totalStudents,
          createdAt: o.createdAt,
        };
      }),
    };
  } catch (err) {
    console.error("getAllOrganizations error:", err);
    return { ok: false, error: err.message };
  }
}

// 2. Impersonation: Ұйымның кабинетіне редирект жасау үшін ID қайтару
export async function impersonateOrganizationAction(orgId) {
  try {
    const org = await prisma.organizer.findUnique({
      where: { id: orgId },
      select: { id: true },
    });

    if (!org) return { ok: false, error: "Ұйым табылмады" };

    return { ok: true, targetOrgId: org.id };
  } catch (err) {
    console.error("impersonateOrganizationAction error:", err);
    return { ok: false, error: err.message };
  }
}
// Ұйымның тарифі мен лимиттерін жаңарту
export async function updateOrgSubscriptionAction(orgId, subData) {
  try {
    const { plan, maxStudents, maxMarathons, expiresAt } = subData || {};

    const updated = await prisma.organizer.update({
      where: { id: orgId },
      data: {
        plan: plan || "FREE",
        maxStudents: Number(maxStudents) || 50,
        maxMarathons: Number(maxMarathons) || 2,
        subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return { ok: true, organizer: updated };
  } catch (err) {
    console.error("updateOrgSubscriptionAction error:", err);
    return { ok: false, error: err.message };
  }
}

// Барлық немесе таңдаулы рөлдерге глобалды хабарландыру жасау
export async function createGlobalBroadcastAction(data) {
  try {
    const { title, message } = data || {};

    if (!title || !message) {
      return { ok: false, error: "Тақырыбы мен мәтінін толтырыңыз" };
    }

    const broadcast = await prisma.announcement.create({
      data: {
        title,
        content: message,
      },
    });

    return { ok: true, broadcast };
  } catch (err) {
    console.error("createGlobalBroadcastAction error:", err);
    return { ok: false, error: err.message };
  }
}
// Owner профилі мен паролін жаңарту
export async function getOwnerProfile() {
  try {
    // 1. OWNER рөлі бар пайдаланушыны аламыз
    let user = await prisma.user.findFirst({
      where: { role: "OWNER" },
    });

    // Егер OWNER болмаса, ең бірінші юзерді аламыз
    if (!user) {
      user = await prisma.user.findFirst();
    }

    if (!user) return { ok: false, error: "Базада пайдаланушы табылмады" };

    // firstName мен lastName-ді бір аты-жөніге біріктіреміз
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");

    return {
      ok: true,
      profile: {
        userId: user.id,
        name: fullName,
        email: user.email || "",
        phone: user.phone || "",
      },
    };
  } catch (err) {
    console.error("getOwnerProfile error:", err);
    return { ok: false, error: err.message };
  }
}
// Owner профилін жаңарту
export async function updateOwnerProfileAction(userId, profileData) {
  try {
    const { name, email, phone, newPassword } = profileData || {};

    if (!userId) return { ok: false, error: "Пайдаланушы ID көрсетілмеген" };

    // Инпутқа жазылған сөзді Аты мен Тегіне бөлу (мысалы: "Димаш Жумамуратов")
    const nameParts = (name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        ...(email ? { email: email.trim().toLowerCase() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(newPassword ? { passwordHash: newPassword } : {}),
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("updateOwnerProfileAction error:", err);
    return { ok: false, error: err.message };
  }
}
// 1. Барлық Организаторларды алу



export async function checkUserForOrganizerAction(contactValue, isEmail) {
  try {
    const formatted = contactValue.trim();

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: formatted.toLowerCase() }
        : { phone: formatted },
      include: {
        organizer: true,
      },
    });

    if (!user) {
      return { status: "not_found" };
    }

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.organizer?.ownerName ||
      user.organizer?.company ||
      "Пайдаланушы";

    // Бұрыннан ORGANIZER рөлінде болса
    if (user.role === "ORGANIZER" || user.organizer) {
      return {
        status: "already_organizer",
        message: "Бұл пайдаланушы бұрыннан Организатор рөлінде",
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    // OWNER рөлінде болса
    if (user.role === "OWNER") {
      return {
        status: "invalid_role",
        message: "Платформа иесін (OWNER) Организатор етіп тағайындауға болмайды",
        user: { id: user.id, name: fullName, email: user.email, phone: user.phone, role: user.role },
      };
    }

    // Тағайындауға дайын
    return {
      status: "ready",
      user: {
        id: user.id,
        name: fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    };
  } catch (err) {
    console.error("checkUserForOrganizerAction error:", err);
    return { status: "not_found" };
  }
}
// 2. Организатор рөлін беру және кестеге тіркеу
// app/actions.js
export async function createOrganizerUserAction(data) {
  try {
    const { userId, name } = data || {};

    if (!userId) {
      return { ok: false, error: "Пайдаланушы ID-і табылмады" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizer: true },
    });

    if (!existingUser) {
      return { ok: false, error: "Бұл пайдаланушы базада табылмады" };
    }

    if (existingUser.role === "ORGANIZER" || existingUser.organizer) {
      return { ok: false, error: "Бұл пайдаланушы бұрыннан Организатор рөлінде" };
    }

    // 1. User рөлін ORGANIZER-ге ауыстыру
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ORGANIZER" },
    });

    const orgName =
      name ||
      [existingUser.firstName, existingUser.lastName].filter(Boolean).join(" ") ||
      "Организатор";

    // 2. Organizer кестесіне міндетті өрістерді толық жазу
    const newOrganizer = await prisma.organizer.create({
      data: {
        userId: existingUser.id,
        company: orgName,
        ownerName: orgName,
        email: existingUser.email,
      },
    });

    return { ok: true, organizer: newOrganizer };
  } catch (err) {
    console.error("createOrganizerUserAction error:", err);
    return { ok: false, error: err.message };
  }
}

// 3. Барлық Организаторлар тізімін алу
export async function getAllOrganizersAction() {
  try {
    const organizers = await prisma.organizer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, phone: true } },
        marathons: {
          select: {
            id: true,
            _count: { select: { students: true } },
          },
        },
      },
    });

    return {
      ok: true,
      organizers: organizers.map((o) => {
        const totalStudents = o.marathons.reduce(
          (acc, m) => acc + (m._count?.students || 0),
          0
        );
        return {
          id: o.id,
          userId: o.user?.id,
          name: o.ownerName || o.company,
          email: o.email || o.user?.email || "—",
          phone: o.user?.phone || "—",
          marathonsCount: o.marathons.length,
          studentsCount: totalStudents,
          createdAt: o.createdAt,
        };
      }),
    };
  } catch (err) {
    console.error("getAllOrganizersAction error:", err);
    return { ok: false, error: err.message };
  }
}