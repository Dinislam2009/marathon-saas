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
import { sendResetOtp, resetPasswordWithOtp } from "@/app/legacy-actions";
import { useLanguage } from "@/context/LanguageContext";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devCode, setDevCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleIdentifierChange = (e) => {
    let val = e.target.value;
    if (/^\d/.test(val)) {
      if (val.startsWith("8")) val = "+7" + val.substring(1);
      else if (!val.startsWith("+")) val = "+7" + val;
    }
    setIdentifier(val);
    setError("");
  };

  async function handleSendOtp(e) {
    e.preventDefault();
    if (!identifier.trim()) {
      setError(isRu ? "Введите Email или номер телефона" : "Email немесе телефон нөмірін енгізіңіз");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await sendResetOtp(identifier);
      if (!res?.ok) {
        setError(res?.error || (isRu ? "Пользователь не найден или произошла ошибка" : "Пайдаланушы табылмады немесе қате орын алды"));
        return;
      }
      setUserId(res.userId);
      if (res.devCode) setDevCode(res.devCode);
      setMessage(isRu ? "Код подтверждения успешно отправлен!" : "Растау коды сәтті жіберілді!");
      setStep(2);
    } catch {
      setError(isRu ? "Произошла серверная ошибка. Попробуйте еще раз." : "Серверлік қате орын алды. Қайталап көріңіз.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (code.length < 6) {
      setError(isRu ? "Код подтверждения должен состоять из 6 цифр" : "Растау коды 6 цифрдан тұруы керек");
      return;
    }
    if (newPassword.length < 6) {
      setError(isRu ? "Новый пароль должен содержать минимум 6 символов" : "Жаңа құпия сөз кемінде 6 символдан тұруы керек");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await resetPasswordWithOtp(userId, code, newPassword);
      if (!res?.ok) {
        setError(res?.error || (isRu ? "Неверный код или истек срок действия" : "Растау коды қате немесе мерзімі өтіп кеткен"));
        return;
      }
      alert(isRu ? "Пароль успешно изменён! Войдите с новым паролем." : "Құпия сөз сәтті өзгертілді! Жаңа парольмен жүйеге кіріңіз.");
      router.push(`/${lang}/login`);
    } catch {
      setError(isRu ? "Произошла серверная ошибка" : "Серверлік қате орын алды");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-12 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`/${lang}/login`} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-600 transition">
            <ArrowLeft size={16} /><span>{isRu ? "Назад ко входу" : "Кіруге қайту"}</span>
          </Link>
          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-full uppercase tracking-wider">
            {step === 1 ? (isRu ? "1 / 2 шаг" : "1 / 2 қадам") : (isRu ? "2 / 2 шаг" : "2 / 2 қадам")}
          </span>
        </div>
        <div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-3"><KeyRound size={24} /></div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            {step === 1 ? (isRu ? "Восстановление пароля" : "Құпия сөзді қалпына келтіру") : (isRu ? "Новый пароль" : "Жаңа құпия сөз қою")}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {step === 1 ? (isRu ? "Введите ваш Email или номер телефона." : "Тіркелген Email мекенжайыңызды немесе телефон нөміріңізді жазыңыз.") : (isRu ? "Введите код подтверждения и новый пароль." : "Жіберілген растау кодын және жаңа құпия сөзді енгізіңіз.")}
          </p>
        </div>
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">{isRu ? "Email или Телефон" : "Email немесе Телефон"}</label>
              <div className="relative">
                <input type="text" required autoFocus value={identifier} onChange={handleIdentifierChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-600" />
              </div>
            </div>
            {error && <div className="text-xs text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50">
              {loading ? (isRu ? "Отправка..." : "Жіберілуде...") : (isRu ? "Отправить код" : "Код жіберу")}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {message && <div className="text-xs text-green-600">{message}</div>}
            {devCode && <div className="text-xs text-slate-500">Dev code: {devCode}</div>}
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="123456" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-600" />
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} placeholder={isRu ? "Новый пароль" : "Жаңа құпия сөз"} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-purple-600" />
            {error && <div className="text-xs text-red-600">{error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold disabled:opacity-50">
              {loading ? (isRu ? "Сохранение..." : "Сақталуда...") : (isRu ? "Изменить пароль" : "Құпия сөзді өзгерту")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
