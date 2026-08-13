"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  KeyRound, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldCheck 
} from "lucide-react";
import { sendResetOtpAction, resetPasswordWithOtpAction } from "@/app/actions";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Нөмір/Email енгізу, 2: OTP + Жаңа пароль

  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devCode, setDevCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Телефон немесе Email енгізу форматын реттеу
  const handleIdentifierChange = (e) => {
    let val = e.target.value;
    if (/^\d/.test(val)) {
      if (val.startsWith("8")) {
        val = "+7" + val.substring(1);
      } else if (!val.startsWith("+")) {
        val = "+7" + val;
      }
    }
    setIdentifier(val);
    setError("");
  };

  // 1-Қадам: СМС/Email код сұрау
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Email немесе телефон нөмірін енгізіңіз");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await sendResetOtpAction(identifier);
      setLoading(false);

      if (!res?.ok) {
        setError(res?.error || "Пайдаланушы табылмады немесе қате орын алды");
        return;
      }

      setUserId(res.userId);
      if (res.devCode) setDevCode(res.devCode);
      setMessage("Растау коды сәтті жіберілді!");
      setStep(2);
    } catch (err) {
      setLoading(false);
      setError("Серверлік қате орын алды. Қайталап көріңіз.");
    }
  }

  // 2-Қадам: Код пен жаңа құпия сөзді растау
  async function handleResetPassword(e) {
    e.preventDefault();
    if (code.length < 6) {
      setError("Растау коды 6 цифрдан тұруы керек");
      return;
    }
    if (newPassword.length < 6) {
      setError("Жаңа құпия сөз кемінде 6 символдан тұруы керек");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await resetPasswordWithOtpAction(userId, code, newPassword);
      setLoading(false);

      if (!res?.ok) {
        setError(res?.error || "Растау коды қате немесе мерзімі өтіп кеткен");
        return;
      }

      alert("Құпия сөз сәтті өзгертілді! Жаңа парольмен жүйеге кіріңіз.");
      router.push("/login");
    } catch (err) {
      setLoading(false);
      setError("Серверлік қате орын алды");
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 space-y-6">
        
        {/* Басқару шапкасы */}
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 transition"
          >
            <ArrowLeft size={16} />
            <span>Кіруге қайту</span>
          </Link>
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-full uppercase tracking-wider">
            {step === 1 ? "1 / 2 қадам" : "2 / 2 қадам"}
          </span>
        </div>

        {/* Тақырып */}
        <div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3">
            <KeyRound size={24} />
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            {step === 1 ? "Құпия сөзді қалпына келтіру" : "Жаңа құпия сөз қою"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1
              ? "Тіркелген Email мекенжайыңызды немесе телефон нөміріңізді жазыңыз."
              : "Жіберілген растау кодын және жаңа құпия сөзді енгізіңіз."}
          </p>
        </div>

        {/* 1-ҚАДАМ: ИДЕНТИФИКАТОР ЕНГІЗУ */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Email немесе Телефон
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={handleIdentifierChange}
                  placeholder="example@mail.kz немесе +7 (7XX)..."
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-10 text-xs font-semibold outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-slate-50 transition"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {identifier.includes("@") ? <Mail size={16} /> : <Phone size={16} />}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-purple-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-purple-200 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Код жіберілуде...</span>
                </>
              ) : (
                <span>Растау кодын алу</span>
              )}
            </button>
          </form>
        ) : (
          /* 2-ҚАДАМ: OTP ЖӘНЕ ЖАҢА ПАРОЛЬ */
          <form onSubmit={handleResetPassword} className="space-y-4">
            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Тесттік режимге арналған код подсказкасы */}
            {devCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-bold flex items-center justify-between">
                <span>Тесттік код:</span>
                <span className="font-mono text-sm tracking-widest bg-amber-100 px-2 py-0.5 rounded-lg">
                  {devCode}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Растау коды (СМС / Email)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-base font-black font-mono tracking-[0.3em] outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-slate-50 transition"
                />
                <ShieldCheck size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Жаңа құпия сөз
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pl-10 text-xs font-semibold outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 bg-slate-50 transition"
                />
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-purple-600 py-3.5 text-xs font-extrabold text-white shadow-md shadow-purple-200 hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Сақталуда...</span>
                  </>
                ) : (
                  <span>Құпия сөзді өзгерту</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError("");
                }}
                className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
              >
                Деректі қайта енгізу
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}