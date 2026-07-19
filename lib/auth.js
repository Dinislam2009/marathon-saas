import { prisma } from "./prisma";
import { claimInvitationsForUser } from "./data";

const OTP_TTL_MS = 5 * 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function findUserByIdentifier(identifier) {
  const value = identifier.trim();
  const isEmail = value.includes("@");

  if (isEmail) {
    // Email болса, бұрынғыша қаз-қалпында іздейміз
    return await prisma.user.findFirst({
      where: {
        email: { equals: value.toLowerCase(), mode: "insensitive" }
      }
    });
  }

  // Егер телефон нөмірі болса:
  // 1. Енгізілген мәннен тек сандарды бөліп аламыз (мысалы: 77079003566)
  const inputDigits = value.replace(/\D/g, "");

  // 2. Базадағы барлық қолданушыларды алып, сандар бойынша сәйкестігін тексереміз
  // (Бұл базада жақша не сызықша болса да, қатесіз табуға көмектеседі)
  const allUsers = await prisma.user.findMany();
  
  const foundUser = allUsers.find(user => {
    if (!user.phone) return false;
    const dbDigits = user.phone.replace(/\D/g, "");
    return dbDigits === inputDigits;
  });

  return foundUser || null;
}

// ✅ Тіркеу функциясы (Тек қатаң +7 форматын қабылдайды)
export async function registerUser(fields) {
  try {
    const emailValue = fields.email.trim().toLowerCase();
    const phoneValue = fields.phone.trim();

    // Бэкэнд деңгейіндегі қатаң тексеріс
    if (!phoneValue.startsWith("+7")) {
      return { ok: false, error: "Телефон нөмірі қатаң түрде +7-ден басталуы керек!" };
    }

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
        passwordHash: fields.password, 
        role: fields.role || "PARTICIPANT", 
        verified: false,
      }
    });

    const code = generateCode();
    
    await prisma.pendingOtp.deleteMany({ where: { userId: user.id } });
    await prisma.pendingOtp.create({
      data: {
        userId: user.id,
        phone: user.phone,
        code,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      }
    });

    return { ok: true, user, devCode: code }; 
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
  const value = identifier.trim();
  
  // Егер email емес және +7-ден басталмаса, бірден қате қайтарамыз
  if (!value.includes("@") && !value.startsWith("+7")) {
    return { ok: false, error: "Телефон нөмірін тек +7 форматында жаза аласыз!" };
  }

  const user = await findUserByIdentifier(value);
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