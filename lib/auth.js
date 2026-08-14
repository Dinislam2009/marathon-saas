import { prisma } from "./prisma";
import { claimInvitationsForUser } from "./data";

const OTP_TTL_MS = 5 * 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ⚡ ОҢТАЙЛАНДЫРЫЛҒАН ІЗДЕУ: findMany() алынып тасталды, іздеу DB деңгейінде орындалады

// ✅ ТҮЗЕТІЛГЕН ТІРКЕУ ФУНКЦИЯСЫ
export async function registerUser(fields) {
  try {
    const emailValue = fields.email.trim().toLowerCase();
    const phoneValue = fields.phone.trim();

    if (!phoneValue.startsWith("+7")) {
      return { ok: false, error: "Телефон нөмірі +7-ден басталуы тиіс." };
    }

    // Бұрыннан бар-жоғын тексеру
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailValue }, { phone: phoneValue }],
      },
    });

    if (existingUser) {
      return { ok: false, error: "Бұл Email немесе телефон бұрыннан тіркелген." };
    }

    // ⚡ organizerId-ді автоматты турде байлаймыз (fields.organizerId арқылы)
    const user = await prisma.user.create({
      data: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: emailValue,
        phone: phoneValue,
        passwordHash: fields.password,
        role: fields.role || "PARTICIPANT",
        organizerId: fields.organizerId || null, // 👈 АВТОМАТТЫ ТҮРДЕ САҚТАЛАДЫ
        verified: false,
      },
    });

    const code = generateCode();

    await prisma.pendingOtp.deleteMany({ where: { userId: user.id } });
    await prisma.pendingOtp.create({
      data: {
        userId: user.id,
        phone: user.phone,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    return { ok: true, user, devCode: code };
  } catch (error) {
    console.error("Register error:", error);
    return { ok: false, error: "Тіркелу сәтсіз аяқталды: " + error.message };
  }
}

export async function getPendingOtp(userId) {
  if (!userId) return null;
  return await prisma.pendingOtp.findUnique({ where: { userId } });
}

export async function resendOtp(userId, phone) {
  const code = generateCode();
  const phoneValue = phone.trim();

  if (!phoneValue.startsWith("+7")) {
    throw new Error("Телефон нөмірі +7-ден басталуы тиіс.");
  }

  await prisma.pendingOtp.deleteMany({ where: { userId } });
  await prisma.pendingOtp.create({
    data: {
      userId,
      phone: phoneValue,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return code;
}

export async function verifyOtp(userId, code) {
  const pending = await prisma.pendingOtp.findUnique({
    where: { userId },
  });

  if (!pending) {
    return { ok: false, error: "Сессия аяқталды. Тіркелуден қайта өтіңіз." };
  }
  if (new Date() > new Date(pending.expiresAt)) {
    return { ok: false, error: "Кодтың мерзімі өтіп кетті. Жаңа код сұратыңыз." };
  }
  if (pending.code !== code) {
    return { ok: false, error: "Қате код. Қайта тексеріңіз." };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { verified: true },
  });

  await prisma.pendingOtp.delete({
    where: { userId },
  });

  const granted = await claimInvitationsForUser(user);

  return { ok: true, granted, user };
}

export async function loginUser(identifier, password) {
  try {
    const value = identifier.trim();
    
    if (!value.includes("@") && !value.startsWith("+7")) {
      return { ok: false, error: "Телефон нөмірін тек +7 форматында жаза аласыз!" };
    }

    // ⚡ Енді findUserByIdentifier функциясы табылады
    const user = await findUserByIdentifier(value);
    if (!user) return { ok: false, error: "Пайдаланушы табылмады." };
    if (!user.verified) return { ok: false, error: "Аккаунт әлі расталмаған." };
    
    if (user.passwordHash !== password) return { ok: false, error: "Құпия сөз қате." };

    return { ok: true, user };
  } catch (error) {
    console.error("loginUser server error:", error);
    return { ok: false, error: "Серверлік қате: " + error.message };
  }
}

export async function getUser(userId) {
  if (!userId) return null;

  try {
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch (error) {
    console.error("getUser error:", error);
    return null;
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem("currentUser");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("currentUser");
}

// ==========================================
// --- Құпия Сөзді Қалпына Келтіру ---
// ==========================================

export async function sendResetOtp(identifier) {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return { ok: false, error: "Бұл идентификатормен пайдаланушы табылмады." };
  }

  const code = generateCode();
  
  await prisma.pendingOtp.deleteMany({ where: { userId: user.id } });
  await prisma.pendingOtp.create({
    data: {
      userId: user.id,
      phone: user.phone,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return { ok: true, userId: user.id, devCode: code };
}

export async function resetPasswordWithOtp({ userId, code, newPassword }) {
  const pending = await prisma.pendingOtp.findUnique({
    where: { userId },
  });

  if (!pending) {
    return { ok: false, error: "Сессия аяқталды. Қайтадан сұрау жіберіңіз." };
  }
  if (new Date() > new Date(pending.expiresAt)) {
    return { ok: false, error: "Кодтың мерзімі өтіп кетті." };
  }
  if (pending.code !== code) {
    return { ok: false, error: "Қате код. Қайта тексеріңіз." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { 
      passwordHash: newPassword,
      verified: true,
    },
  });

  await prisma.pendingOtp.delete({
    where: { userId },
  });

  return { ok: true };
}
export async function findUserByIdentifier(identifier) {
  if (!identifier || typeof identifier !== "string") return null;

  const value = identifier.trim();
  const isEmail = value.includes("@");

  // 1. Email арқылы іздеу
  if (isEmail) {
    return await prisma.user.findFirst({
      where: {
        email: { equals: value.toLowerCase(), mode: "insensitive" },
      },
    });
  }

  // 2. Телефон нөмірі арқылы іздеу
  const cleanDigits = value.replace(/\D/g, ""); // "77079003568"
  const target10 = cleanDigits.slice(-10);       // "7079003568"

  if (!target10) return null;

  // Базадағы барлық пайдаланушыларды алып, нөмірлеріндегі дефис/жақшаларды тазалап салыстырамыз:
  const users = await prisma.user.findMany();

  const foundUser = users.find((u) => {
    if (!u.phone) return false;
    const dbPhoneDigits = u.phone.replace(/\D/g, ""); // "+7 (707) 900-35-68" -> "77079003568"
    return dbPhoneDigits.endsWith(target10);
  });

  return foundUser || null;
}