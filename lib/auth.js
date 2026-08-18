import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { claimInvitationsForUser } from "./data";

const OTP_TTL_MS = 5 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function isBcryptHash(value) {
  return typeof value === "string" && /^\$2[aby]?\$\d{2}\$/.test(value);
}

export async function registerUser(fields) {
  try {
    const emailValue = fields.email.trim().toLowerCase();
    const phoneValue = fields.phone.trim();

    if (!phoneValue.startsWith("+7")) {
      return { ok: false, error: "Телефон нөмірі +7-ден басталуы тиіс." };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: emailValue }, { phone: phoneValue }],
      },
    });

    if (existingUser) {
      return { ok: false, error: "Бұл Email немесе телефон бұрыннан тіркелген." };
    }

    const passwordHash = await bcrypt.hash(fields.password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: emailValue,
        phone: phoneValue,
        passwordHash,
        role: fields.role || "PARTICIPANT",
        organizerId: fields.organizerId || null,
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

    return {
      ok: true,
      user: sanitizeUser(user),
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    };
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
  if (!userId || !phone) {
    throw new Error("userId және телефон нөмірі қажет.");
  }

  const code = generateCode();
  const phoneValue = phone.trim();

  if (!phoneValue.startsWith("+7")) {
    throw new Error("Телефон нөмірі +7-ден басталуы тиіс.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.phone !== phoneValue) {
    throw new Error("Пайдаланушы мен телефон сәйкес келмейді.");
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

  return process.env.NODE_ENV !== "production" ? code : null;
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
  if (pending.code !== String(code).trim()) {
    return { ok: false, error: "Қате код. Қайта тексеріңіз." };
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { verified: true },
  });

  await prisma.pendingOtp.delete({ where: { userId } });

  const granted = await claimInvitationsForUser(user);

  return { ok: true, granted, user: sanitizeUser(user) };
}

export async function loginUser(identifier, password) {
  try {
    const value = identifier.trim();

    if (!value.includes("@") && !value.startsWith("+7")) {
      return { ok: false, error: "Телефон нөмірін тек +7 форматында жаза аласыз!" };
    }

    const user = await findUserByIdentifier(value);
    if (!user) return { ok: false, error: "Пайдаланушы табылмады." };
    if (!user.verified) return { ok: false, error: "Аккаунт әлі расталмаған." };

    let passwordValid = false;

    if (isBcryptHash(user.passwordHash)) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    } else {
      // Legacy accounts created before password hashing.
      passwordValid = user.passwordHash === password;

      if (passwordValid) {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await prisma.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }
    }

    if (!passwordValid) return { ok: false, error: "Құпия сөз қате." };

    return { ok: true, user: sanitizeUser(user) };
  } catch (error) {
    console.error("loginUser server error:", error);
    return { ok: false, error: "Серверлік қате: " + error.message };
  }
}

export async function getUser(userId) {
  if (!userId) return null;

  try {
    return sanitizeUser(await prisma.user.findUnique({ where: { id: userId } }));
  } catch (error) {
    console.error("getUser error:", error);
    return null;
  }
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem("currentUser");
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("currentUser");
}

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

  return {
    ok: true,
    userId: user.id,
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  };
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
  if (pending.code !== String(code).trim()) {
    return { ok: false, error: "Қате код. Қайта тексеріңіз." };
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      verified: true,
    },
  });

  await prisma.pendingOtp.delete({ where: { userId } });

  return { ok: true };
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

  return (
    users.find((u) => {
      if (!u.phone) return false;
      const dbPhoneDigits = u.phone.replace(/\D/g, "");
      return dbPhoneDigits.endsWith(target10);
    }) || null
  );
}
