"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

// --- ⚡ СЕРВЕРЛІК ACTION-ДАРДЫ ИМПОРТТАУ (КЛИЕНТТІК ИМПОРТТАР ТАЗАЛАНДЫ) ---
import { 
  verifyOtpAction, 
  resendOtpAction, 
  getPendingOtpAction 
} from "@/app/actions";

function maskPhone(phone) {
  if (!phone) return "";
  return phone.replace(/(\+7 \(\d)\d\d(\) \d{3}-\d{2}-)(\d{2})/, "$1••$2$3");
}

function VerifyOtpForm() {
  const router = useRouter();
  const uid = useSearchParams().get("uid");
  const inputsRef = useRef([]);
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const [devCode, setDevCode] = useState("");
  const [phone, setPhone] = useState("");

  // Күтудегі OTP мен телефон нөмірін серверден алу
  useEffect(() => {
    async function loadPendingOtp() {
      const pending = await getPendingOtpAction();
      if (pending) {
        setDevCode(pending.code);
        setPhone(pending.phone);
      }
    }
    loadPendingOtp();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function handleChange(i, value) {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) inputsRef.current[i + 1]?.focus();

    if (next.every(Boolean) && next.join("").length === 6) {
      submit(next.join(""));
    }
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
  }

  // Серверлік Action арқылы кодты тексеру
  async function submit(code) {
    const result = await verifyOtpAction(uid, code);
    if (!result.ok) {
      setError(result.error);
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      return;
    }

    // Сәтті өткенде пайдаланушы ID-ді сақтап, бағыттау
    if (result.userId) {
      localStorage.setItem("current_user_id", result.userId);
    }

    const grant = result.granted?.[0];
    if (grant?.role === "student") {
      router.push(`/org/${grant.orgId}/student`);
    } else if (grant?.role === "mentor") {
      router.push(`/org/${grant.orgId}/mentor`);
    } else {
      router.push("/start");
    }
  }

  // Кодты қайта жіберу
  async function handleResend() {
    if (cooldown > 0) return;
    const result = await resendOtpAction(uid, phone);
    if (result.ok) {
      setDevCode(result.code);
      setCooldown(60);
    } else {
      setError(result.error || "Ошибка при повторной отправке кода");
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-6">
      <div className="flex items-center justify-between mb-10">
        <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-mist">
          <ArrowLeft size={14} /> Назад
        </Link>
        <span className="text-sm font-medium text-horizon-dark">Помощь</span>
      </div>

      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">
          Мы отправили вам SMS
        </h1>
        <p className="text-sm text-mist mb-8">
          Введите код подтверждения: <span className="font-medium text-ink">{maskPhone(phone)}</span>
        </p>

        <div className="flex justify-between gap-2 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              maxLength={1}
              autoFocus={i === 0}
              className="w-12 h-14 text-center text-xl font-semibold rounded-2xl border border-mist-light focus:border-horizon focus:ring-2 focus:ring-horizon/20 outline-none"
            />
          ))}
        </div>

        {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2 mb-4">{error}</p>}

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-sm text-horizon-dark font-medium disabled:text-mist disabled:font-normal"
        >
          {cooldown > 0 ? `Отправить код повторно (${cooldown}с)` : "Отправить код повторно"}
        </button>

        {devCode && (
          <div className="mt-8 rounded-xl border border-dashed border-horizon/40 bg-horizon/5 px-4 py-3 text-xs text-horizon-dark">
            <strong>Демо-режим:</strong> код — <span className="font-mono font-bold">{devCode}</span>.
            После подключения smsc.kz этот блок исчезнет, код будет приходить по SMS/WhatsApp.
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <VerifyOtpForm />
    </Suspense>
  );
}