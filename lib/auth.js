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

// Пайдаланушыны тіркеу және OTP кодын сақтау
export async function registerUser(fields) {
  // ⚡ Схемадағы passwordHash өрісіне сәйкестендірілді (Phase 2-де осы жерде хэштейсің)
  const user = await prisma.user.create({
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phone: fields.phone,
      passwordHash: fields.password, 
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

  return { user, devCode: code };
}

export async function getPendingOtp(userId) {
  // userId бірегей (@unique) болғандықтан findUnique тиімдірек жұмыс істейді
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

  // Пайдаланушыны расталды деп белгілеу
  const user = await prisma.user.update({
    where: { id: userId },
    data: { verified: true }
  });

  // Пайдаланылған OTP кодын өшіру (userId бірегей болғандықтан тікелей осылай өшіруге болады)
  await prisma.pendingOtp.delete({
    where: { userId }
  });

  // Шақыруларды тексеру және құқықтарды беру (lib/data.js-дегі асинхронды функция)
  const granted = await claimInvitationsForUser(user);

  return { ok: true, granted, user };
}

export async function loginUser(identifier, password) {
  const user = await findUserByIdentifier(identifier);
  if (!user) return { ok: false, error: "Пайдаланушы табылмады." };
  if (!user.verified) return { ok: false, error: "Аккаунт әлі расталмаған." };
  
  // ⚡ Схемадағы passwordHash өрісімен салыстыру жасалады
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