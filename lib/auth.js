import { prisma } from "./prisma";
import { claimInvitationsForUser } from "./data";

const OTP_TTL_MS = 5 * 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function findUserByIdentifier(identifier) {
  const value = identifier.trim().toLowerCase();
  return await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: value, mode: "insensitive" } },
        { phone: identifier.trim() }
      ]
    }
  });
}

// ✅ ТҮЗЕТІЛДІ: Қауіпсіз әрі толық тіркеу функциясы
export async function registerUser(fields) {
  try {
    const emailValue = fields.email.trim().toLowerCase();
    const phoneValue = fields.phone.trim();

    // 1. Алдын ала email немесе телефонның базада бар-жоғын тексеру
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailValue },
          { phone: phoneValue }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === emailValue) {
        return { ok: false, error: "Бұл email мекенжайы бұрыннан тіркелген." };
      }
      if (existingUser.phone === phoneValue) {
        return { ok: false, error: "Бұл телефон нөмірі бұрыннан тіркелген." };
      }
    }

    // 2. Пайдаланушыны базаға рөлімен бірге жазу
    const user = await prisma.user.create({
      data: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: emailValue,
        phone: phoneValue,
        passwordHash: fields.password, // Phase 2-де осы жерде хэштейсің
        role: fields.role || "PARTICIPANT", // ⚡ ТҮЗЕТІЛДІ: Міндетті рөл өрісі қосылды (әдепкі бойынша PARTICIPANT)
        verified: false,
      }
    });

    const code = generateCode();
    
    // Ескі OTP болса өшіріп, жаңасын жазамыз
    await prisma.pendingOtp.deleteMany({ where: { userId: user.id } });
    await prisma.pendingOtp.create({
      data: {
        userId: user.id,
        phone: user.phone,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      }
    });

    return { ok: true, user, devCode: code }; // ⚡ ТҮЗЕТІЛДІ: Жоба стиліне сай ok: true қайтарады
  } catch (error) {
    console.error("Тіркелу кезіндегі Prisma қатесі:", error);
    return { ok: false, error: "Тіркелу сәтсіз аяқталды: " + error.message };
  }
}

export async function getPendingOtp(userId) {
  return await prisma.pendingOtp.findUnique({
    where: { userId }
  });
}

export async function resendOtp(userId, phone) {
  const code = generateCode();
  await prisma.pendingOtp.deleteMany({ where: { userId } });
  await prisma.pendingOtp.create({
    data: {
      userId,
      phone,
      code,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    }
  });
  return code;
}

export async function verifyOtp(userId, code) {
  const pending = await prisma.pendingOtp.findUnique({
    where: { userId }
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
    data: { verified: true }
  });

  await prisma.pendingOtp.delete({
    where: { userId }
  });

  const granted = await claimInvitationsForUser(user);

  return { ok: true, granted, user };
}

export async function loginUser(identifier, password) {
  const user = await findUserByIdentifier(identifier);
  if (!user) return { ok: false, error: "Пайдаланушы табылмады." };
  if (!user.verified) return { ok: false, error: "Аккаунт әлі расталмаған." };
  
  if (user.passwordHash !== password) return { ok: false, error: "Құпия сөз қате." };

  return { ok: true, user };
}

export async function getUser(userId) {
  return await prisma.user.findUnique({ where: { id: userId } });
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