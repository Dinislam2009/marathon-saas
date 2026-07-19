"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
// 🚀 Сенің app/actions.js файлындағы дайын функцияны импорттаймыз:
import { registerUserAction } from "@/app/actions"; 
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
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // 1. Клиенттік валидациялар
    if (!isValidKzPhone(form.phone)) {
      setError("Введите полный номер телефона (+7 (7XX) XXX-XX-XX).");
      return;
    }
    if (form.password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);

    try {
      // 2. Дайын Server Action арқылы тіркеу (Ішінде findUserByIdentifier тексерісі автоматты түрде орындалады)
      const res = await registerUserAction(form);

      setLoading(false);

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.user && res.user.id) {
        // Сәтті өтсе, OTP растау бетіне жібереміз
        router.push(`/verify-otp?uid=${res.user.id}`);
      } else {
        setError("Не удалось получить данные пользователя.");
      }
    } catch (err) {
      setLoading(false);
      setError("Произошла ошибка при регистрации. Попробуйте еще раз.");
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-8">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-mist mb-6">
        <ArrowLeft size={14} /> Назад
      </Link>

      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-horizon-dark text-center mb-1">
          Регистрация
        </h1>
        <p className="text-sm text-mist text-center mb-6">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-horizon-dark font-medium">
            Вход
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Имя</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Фамилия</span>
              <input
                required
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Номер телефона (Whatsapp)</span>
            <input
              required
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => set("phone", formatKzPhone(e.target.value))}
              placeholder="+7 (7XX) XXX-XX-XX"
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
            <span className="text-xs text-mist">Принимаются только номера Казахстана</span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Придумайте пароль</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="не менее 6 символов"
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Повторите пароль</span>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
          </label>

          {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </Button>
        </form>
      </div>
    </div>
  );
}