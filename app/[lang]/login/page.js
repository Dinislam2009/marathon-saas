"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/app/actions";
import Button from "@/components/Button";
import { useLanguage } from "@/context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginUser(identifier, password);
      setLoading(false);

      if (!result || result.error) {
        setError(result?.error || (isRu ? "Произошла ошибка" : "Қате орын алды"));
        return;
      }

      if (result.user && result.user.id) {
        localStorage.setItem("current_user_id", result.user.id);
        if (result.user.role) {
          localStorage.setItem("user_role", result.user.role);
        }
      }

      // ⚡ Рөлге сай таза бағыттау (/start арқылы)
      router.push("/start");

    } catch (err) {
      setLoading(false);
      setError(isRu ? "Ошибка связи с сервером или произошла ошибка." : "Сервермен байланыс үзілді немесе қате шықты.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper font-sans text-slate-900">
      <div className="bg-gradient-to-br from-horizon to-horizon-dark px-6 pt-14 pb-16 text-white text-center">
        <img src="/logo.png" alt="Loopit" className="h-14 w-14 object-contain mx-auto mb-3 bg-white/90 rounded-2xl p-1.5" />
        <h1 className="font-display font-extrabold text-xl">
          LOOP<span className="text-white/70">IT</span>
        </h1>
      </div>

      <div className="flex-1 px-6 -mt-8">
        <div className="bg-white rounded-3xl shadow-lg border border-mist-light p-6 max-w-sm mx-auto">
          <h2 className="font-display text-xl font-semibold text-ink mb-1">
            {isRu ? "Вход" : "Кіру"}
          </h2>
          <p className="text-sm text-mist mb-6">
            {isRu ? "Войдите в аккаунт, чтобы продолжить" : "Жалғастыру үшін аккаунтыңызға кіріңіз"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">
                {isRu ? "Email или номер телефона" : "Email немесе телефон нөмірі"}
              </span>
              <input
                required
                autoFocus
                value={identifier}
                onChange={handleIdentifierChange}
                placeholder="email@mail.kz немесе +7..."
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">
                {isRu ? "Пароль" : "Құпия сөз"}
              </span>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-mist-light px-3.5 py-3 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-xs text-mist hover:text-horizon-dark transition-colors">
                  {isRu ? "Забыли пароль?" : "Құпия сөзді ұмыттыңыз ба?"}
                </Link>
              </div>
            </label>

            {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full cursor-pointer">
              {loading ? (isRu ? "Проверка..." : "Тексерілуде...") : (isRu ? "Войти" : "Кіру")}
            </Button>
          </form>

          <p className="text-center text-sm text-mist mt-6">
            {isRu ? "Нет аккаунта? " : "Аккаунтыңыз жоқ па? "}
            <Link href="/register" className="text-horizon-dark font-medium">
              {isRu ? "Регистрация" : "Тіркелу"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}