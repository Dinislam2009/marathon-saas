"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { registerUser, findUserByIdentifier } from "@/lib/auth";
import { formatKzPhone, isValidKzPhone } from "@/lib/utils";
import Button from "@/components/ui/Button";

const EMPTY = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "+7",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isValidKzPhone(form.phone)) {
      setError("Телефон нөмірін толық енгізіңіз (+7 (7XX) XXX-XX-XX).");
      return;
    }
    if (form.password.length < 6) {
      setError("Құпия сөз кемінде 6 таңбадан тұруы керек.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Құпия сөздер сәйкес келмейді.");
      return;
    }
    if (findUserByIdentifier(form.email) || findUserByIdentifier(form.phone)) {
      setError("Бұл email немесе телефон нөмірімен аккаунт тіркелген.");
      return;
    }

    try {
      const { user } = registerUser(form);
      router.push(`/verify-otp?uid=${user.id}`);
    } catch (err) {
      setError("Тіркелу кезінде техникалық қате кетті. Қайта көріңіз.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-center px-6 py-12 md:py-20">
      <div className="max-w-md w-full mx-auto">
        {/* Артқа қайту батырмасы */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Артқа
        </Link>

        {/* Тіркелу картасы */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-950 tracking-tight mb-2">
              Тіркелу
            </h1>
            <p className="text-sm text-slate-500">
              Аккаунтыңыз бар ма?{" "}
              <Link
                href="/login"
                className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold transition-colors"
              >
                Кіру
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Аты және Тегі */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 tracking-wide">
                  Аты
                </label>
                <input
                  required
                  type="text"
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Әли"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 tracking-wide">
                  Тегі
                </label>
                <input
                  required
                  type="text"
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Серік"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide">
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="example@mail.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Телефон нөмірі */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide">
                Телефон нөмірі
              </label>
              <input
                required
                type="text"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => set("phone", formatKzPhone(e.target.value))}
                placeholder="+7 (707) 123-45-67"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400"
              />
              <span className="text-[11px] text-slate-400">Тек Қазақстан нөмірлері қабылданады</span>
            </div>

            {/* Құпия сөз орнату */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide">
                Құпия сөз орнату
              </label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="кемінде 6 таңба"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Құпия сөзді қайталау */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600 tracking-wide">
                Құпия сөзді қайталаңыз
              </label>
              <input
                required
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all"
              />
            </div>

            {/* Қате шыққандағы хабарлама */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-xs text-rose-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Тіркелу батырмасы */}
            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] hover:from-[#6D28D9] hover:to-[#4C1D95] text-white font-semibold transition-all shadow-sm rounded-xl py-3 text-sm"
            >
              Тіркелу
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}