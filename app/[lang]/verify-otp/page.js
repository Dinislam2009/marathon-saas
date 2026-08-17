"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Button from "@/components/Button";
import { useLanguage } from "@/context/LanguageContext";
import * as actions from "@/app/actions";
import { resendOtp } from "@/app/otp-actions";

function maskPhone(phone) {
  if (!phone) return "";
  return phone.replace(/(\+7 \(\d)\d\d(\) \d{3}-\d{2}-)(\d{2})/, "$1••$2$3");
}

const getRedirectPathByRole = (user, lang = "ru") => {
  const normalizedRole = String(user?.role || "").toUpperCase().trim();
  const orgId = user?.organizerId || user?.orgId || "";

  switch (normalizedRole) {
    case "OWNER":
    case "SUPER_ADMIN":
      return `/${lang}/org/${orgId || "main"}/owner`;

    case "ORGANIZER":
    case "ADMIN":
      return orgId ? `/${lang}/org/${orgId}/admin` : `/${lang}/login`;

    case "MANAGER":
    case "SALES_MANAGER":
      return orgId ? `/${lang}/org/${orgId}/manager` : `/${lang}/login`;

    case "TEACHER":
    case "INSTRUCTOR":
      return orgId ? `/${lang}/org/${orgId}/admin/tasks` : `/${lang}/login`;

    case "BASCURATOR":
    case "INSPECTOR":
      return orgId ? `/${lang}/org/${orgId}/admin/curators` : `/${lang}/login`;

    case "CURATOR":
      return orgId ? `/${lang}/org/${orgId}/curator` : `/${lang}/login`;

    case "STUDENT":
    case "PARTICIPANT":
    default:
      return orgId ? `/${lang}/org/${orgId}/student` : `/${lang}/login`;
  }
};

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const uid = searchParams.get("uid");
  const inputsRef = useRef([]);
  const [digits, setDigits] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(60);

  // ⚡ ДЕМО РЕЖИМ: Әдепкі бойынша 123456 және телефонды көрсетіп қоямыз
  const [devCode, setDevCode] = useState("123456");
  const [phone, setPhone] = useState("");

  // Күтудегі OTP-ді серверден алу
  useEffect(() => {
    async function loadPendingOtp() {
      if (!uid) return;
      try {
        const getPendingFn = actions.getPendingOtp || actions.getPendingOtp;
        let pending = null;

        if (typeof getPendingFn === "function") {
          pending = await getPendingFn(uid);
        }

        if (pending && pending.code) {
          setDevCode(pending.code);
          if (pending.phone) setPhone(pending.phone);
        }
      } catch (err) {
        console.error("Pending OTP load error:", err);
      }
    }
    loadPendingOtp();
  }, [uid]);

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

  // ✅ СЕРВЕРГЕ ЖІБЕРУ ЖӘНЕ ҚАУІПСІЗ БАҒЫТТАУ ЛОГИКАСЫ
  async function submit(code) {
    try {
      const verifyFn = actions.verifyOtp || actions.verifyOtp;
      let result = null;

      if (typeof verifyFn === "function") {
        result = await verifyFn(uid, code);
      }

      if (!result || !result.ok) {
        setError(
          result?.error ||
            (isRu
              ? "Неверный код подтверждения"
              : "Растау коды қате енгізілді")
        );
        setDigits(Array(6).fill(""));
        inputsRef.current[0]?.focus();
        return;
      }

      // ⚡ 1. Ескі сессияны толық тазалап, жаңа юзерді сақтау
      if (typeof window !== "undefined") {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("current_user_id");
        localStorage.removeItem("user_role");
        localStorage.removeItem("current_org_id");

        if (result.user) {
          localStorage.setItem("currentUser", JSON.stringify(result.user));
          localStorage.setItem("current_user_id", result.user.id);
          if (result.user.role) {
            localStorage.setItem("user_role", result.user.role);
          }
          if (result.user.organizerId || result.user.orgId) {
            localStorage.setItem("current_org_id", result.user.organizerId || result.user.orgId);
          }
        }
      }

      // ⚡ 2. Рөлге және orgId-ге байланысты ТУРА кабинетке бағыттау
      const targetPath = getRedirectPathByRole(result.user, lang);
      router.push(targetPath);

    } catch (err) {
      console.error("OTP verification error:", err);
      setError(
        isRu
          ? "Произошла ошибка при проверке кода."
          : "Кодты тексеру кезінде қате орын алды."
      );
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
    }
  }

  // Кодты қайта жіберу
  async function handleResend() {
    if (cooldown > 0) return;
    try {
      const result = await resendOtp(uid, phone);
      }

      if (result && result.ok) {
        setDevCode(result.code);
        setCooldown(60);
      } else {
        setError(
          result?.error ||
            (isRu
              ? "Ошибка при повторной отправке кода"
              : "Кодты қайта жіберу кезінде қате орын алды")
        );
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError(
        isRu
          ? "Ошибка при повторной отправке кода"
          : "Кодты қайта жіберу кезінде қате орын алды"
      );
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-6 font-sans text-slate-900">
      <div className="flex items-center justify-between mb-10">
        <Link
          href={`/${lang}/register`}
          className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-horizon-dark transition-colors"
        >
          <ArrowLeft size={14} /> {isRu ? "Назад" : "Артқа"}
        </Link>
        <span className="text-sm font-medium text-horizon-dark">
          {isRu ? "Помощь" : "Көмек"}
        </span>
      </div>

      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">
          {isRu ? "Мы отправили вам SMS" : "Біз сізге SMS жібердік"}
        </h1>
        <p className="text-sm text-mist mb-8">
          {isRu ? "Введите код подтверждения: " : "Растау кодын енгізіңіз: "}
          <span className="font-medium text-ink">{maskPhone(phone)}</span>
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

        {error && (
          <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleResend}
          disabled={cooldown > 0}
          className="text-sm text-horizon-dark font-medium disabled:text-mist disabled:font-normal cursor-pointer disabled:cursor-not-allowed"
        >
          {cooldown > 0
            ? isRu
              ? `Отправить код повторно (${cooldown}с)`
              : `Кодты қайта жіберу (${cooldown}с)`
            : isRu
            ? "Отправить код повторно"
            : "Кодты қайта жіберу"}
        </button>

        {devCode && (
          <div className="mt-8 rounded-xl border border-dashed border-horizon/40 bg-horizon/5 px-4 py-3 text-xs text-horizon-dark">
            <strong>{isRu ? "Демо-режим:" : "Демо-режим:"}</strong>{" "}
            {isRu ? "код — " : "код — "}
            <span className="font-mono font-bold">{devCode}</span>.
            {isRu
              ? " После подключения smsc.kz этот блок исчезнет, код будет приходить по SMS/WhatsApp."
              : " smsc.kz қосылғаннан кейін бұл блок жоғалады, код SMS/WhatsApp арқылы келеді."}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper font-sans" />}>
      <VerifyOtpForm />
    </Suspense>
  );
}