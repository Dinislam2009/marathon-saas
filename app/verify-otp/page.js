"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPendingOtp, resendOtp, verifyOtp, getUser } from "@/lib/auth";
import Button from "@/components/ui/Button";

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

  useEffect(() => {
    const pending = getPendingOtp();
    if (pending) {
      setDevCode(pending.code);
      setPhone(pending.phone);
    }
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

  function submit(code) {
    const result = verifyOtp(uid, code);
    if (!result.ok) {
      setError(result.error);
      setDigits(Array(6).fill(""));
      inputsRef.current[0]?.focus();
      return;
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

  function handleResend() {
    if (cooldown > 0) return;
    const user = getUser(uid);
    const code = resendOtp(uid, user?.phone || phone);
    setDevCode(code);
    setCooldown(60);
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-6">
      <div className="flex items-center justify-between mb-10">
        <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-mist">
          <ArrowLeft size={14} /> Артқа
        </Link>
        <span className="text-sm font-medium text-horizon-dark">Көмек</span>
      </div>

      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">
          Сізге SMS жібердік
        </h1>
        <p className="text-sm text-mist mb-8">
          Растау кодын енгізіңіз: <span className="font-medium text-ink">{maskPhone(phone)}</span>
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
          {cooldown > 0 ? `Кодты қайта жіберу (${cooldown}с)` : "Кодты қайта жіберу"}
        </button>

        {devCode && (
          <div className="mt-8 rounded-xl border border-dashed border-horizon/40 bg-horizon/5 px-4 py-3 text-xs text-horizon-dark">
            <strong>Demo режимі:</strong> код — <span className="font-mono font-bold">{devCode}</span>.
            smsc.kz қосылғанда бұл блок жойылады, код нақты SMS/WhatsApp арқылы келеді.
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

