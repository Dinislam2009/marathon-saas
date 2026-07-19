"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
// ❌ Ескі import { loginUser } from "@/lib/auth" өшірілді
// ✅ Жаңа Серверлік Action импортталды:
import { loginUserAction } from "@/app/actions";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Серверлік action асинхронды болғандықтан, функцияға async қостық
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Серверлік action-ды шақырамыз және жауабын күтеміз (await)
      const result = await loginUserAction(identifier, password);
      setLoading(false);

      if (!result.ok) {
        setError(result.error || "Қате орын алды");
        return;
      }

      // ✅ ЛОГИН СӘТТІ ӨТКЕН ТҰС: Пайдаланушы ID-ін сақтаймыз
      if (result.user && result.user.id) {
        localStorage.setItem("current_user_id", result.user.id);
      }

      // Сәтті кірген соң келесі бетке бағыттау
      router.push("/start");
    } catch (err) {
      setLoading(false);
      setError("Сервермен байланыс үзілді немесе қате шықты.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <div className="bg-gradient-to-br from-horizon to-horizon-dark px-6 pt-14 pb-16 text-white text-center">
        <img src="/logo.png" alt="Loopit" className="h-14 w-14 object-contain mx-auto mb-3 bg-white/90 rounded-2xl p-1.5" />
        <h1 className="font-display font-extrabold text-xl">
          LOOP<span className="text-white/70">IT</span>
        </h1>
      </div>

      <div className="flex-1 px-6 -mt-8">
        <div className="bg-white rounded-3xl shadow-lg border border-mist-light p-6 max-w-sm mx-auto">
          <h2 className="font-display text-xl font-semibold text-ink mb-1">Вход</h2>
          <p className="text-sm text-mist mb-6">Войдите в аккаунт, чтобы продолжить</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Email или номер телефона</span>
              <input
                required
                autoFocus
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="email@mail.kz или +7..."
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Пароль</span>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mist"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

            <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
              {loading ? "Проверка..." : "Войти"}
            </Button>
          </form>

          <p className="text-center text-sm text-mist mt-6">
            Нет аккаунта?{" "}
            <Link href="/register" className="text-horizon-dark font-medium">
              Регистрация
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}