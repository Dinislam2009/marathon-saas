"use server";

import { prisma } from "@/lib/prisma";

export async function resendOtp(uid, phone) {
  try {
    if (!uid) return { ok: false, error: "Сессия аяқталды. Қайта тіркеліңіз." };

    const user = await prisma.user.findUnique({
      where: { id: String(uid) },
      select: { id: true, phone: true },
    });

    if (!user) return { ok: false, error: "Пайдаланушы табылмады." };

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const targetPhone = user.phone || phone || "";

    await prisma.pendingOtp.create({
      data: {
        userId: user.id,
        phone: targetPhone,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    return { ok: true, code, phone: targetPhone };
  } catch (error) {
    console.error("resendOtp error:", error);
    return { ok: false, error: error?.message || "OTP қайта жіберу кезінде қате орын алды" };
  }
}
