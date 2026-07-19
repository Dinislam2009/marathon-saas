"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendResetOtpAction, resetPasswordWithOtpAction } from "@/app/actions";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: 📞 Нөмір енгізу, 2: 🔢 OTP + Жаңа Пароль
  
  const [identifier, setIdentifier] = useState("");
  const [userId, setUserId] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [devCode, setDevCode] = useState(""); // Тесттік режимге арналған код
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Қатаң +7 форматы (8-ді бұғаттау)
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
  };

  // 1-Қадам: Кодқа сұраныс жіберу
  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await sendResetOtpAction(identifier);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Қате орын алды");
      return;
    }

    setUserId(res.userId);
    if (res.devCode) setDevCode(res.devCode); // Экранға кодты шығару (тест үшін)
    setMessage("Растау коды сәтті жіберілді!");
    setStep(2);
  }

  // 2-Қадам: Код пен Жаңа парольді растау
  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await resetPasswordWithOtpAction(userId, code, newPassword);
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Код қате немесе уақыты өтіп кеткен");
      return;
    }

    alert("Құпия сөз сәтті өзгертілді! Енді жаңа парольмен кіре аласыз.");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="bg-gradient-to-br from-horizon to-horizon-dark px-6 pt-14 pb-16 text-white text-center">
        <h1 className="font-display font-extrabold text-xl">Восстановление</h1>
      </div>

      <div className="flex-1 px-6 -mt-8">
        <div className="bg-white rounded-3xl shadow-lg border border-mist-light p-6 max-w-sm mx-auto">
          <h2 className="font-display text-xl font-semibold text-ink mb-1">Сброс пароля</h2>
          
          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-3 mt-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Введите Email или Номер телефона</span>
                <input
                  required
                  autoFocus
                  value={identifier}
                  onChange={handleIdentifierChange}
                  placeholder="email@mail.kz или +7..."
                  className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
                />
              </label>
              
              {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}
              
              <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
                {loading ? "Отправка..." : "Получить код"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-3 mt-4">
              {message && <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">{message}</p>}
              
              {/* Тесттік режимде кодты оңай көру үшін */}
              {devCode && (
                <div className="bg-amber/10 border border-amber/30 rounded-xl p-3 text-xs text-amber-800">
                  Тесттік код: <strong>{devCode}</strong>
                </div>
              )}

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Код из СМС / Email</span>
                <input
                  required
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="rounded-xl border border-mist-light px-3.5 py-3 text-sm text-center tracking-widest font-bold"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Новый пароль</span>
                <input
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
                />
              </label>

              {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

              <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
                {loading ? "Сохранение..." : "Сбросить пароль"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-mist mt-6">
            <Link href="/login" className="text-horizon-dark font-medium">
              Назад ко входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}