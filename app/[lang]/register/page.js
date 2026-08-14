"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import * as actions from "@/app/actions";
import { registerUser as registerUserFn } from "@/app/actions"; 
import { formatKzPhone, isValidKzPhone } from "@/lib/utils";
import Button from "@/components/Button";
import { useLanguage } from "@/context/LanguageContext";

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
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!isValidKzPhone(form.phone)) {
      setError(
        isRu 
          ? "Введите полный номер телефона (+7 (7XX) XXX-XX-XX)." 
          : "Толық телефон нөмірін енгізіңіз (+7 (7XX) XXX-XX-XX)."
      );
      return;
    }
    if (form.password.length < 6) {
      setError(
        isRu 
          ? "Пароль должен содержать не менее 6 символов." 
          : "Құпия сөз кемінде 6 таңбадан тұруы керек."
      );
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError(isRu ? "Пароли не совпадают." : "Құпия сөздер сәйкес келмейді.");
      return;
    }

    setLoading(true);

    try {
      const actionToCall = actions.registerUser || registerUserFn;
      let res = null;

      if (typeof actionToCall === "function") {
        res = await actionToCall(form);
      }

      setLoading(false);

      if (!res || res.error) {
        setError(
          res?.error || 
          (isRu ? "Произошла ошибка при регистрации." : "Тіркелу кезінде қате орын алды.")
        );
        return;
      }

      if (res.user && res.user.id) {
        // ⚡ Тіл префиксін ескеріп /verify-otp бетіне жібереміз
        router.push(`/${lang}/verify-otp?uid=${res.user.id}`);
      } else {
        setError(
          isRu 
            ? "Не удалось получить данные пользователя." 
            : "Пайдаланушы мәліметтерін алу мүмкін болмады."
        );
      }
    } catch (err) {
      console.error("Register error:", err);
      setLoading(false);
      setError(
        isRu 
          ? "Произошла ошибка при регистрации. Попробуйте еще раз." 
          : "Тіркелу кезінде қате орын алды. Қайтадан байқап көріңіз."
      );
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-8 font-sans text-slate-900">
      <Link href={`/${lang}/login`} className="inline-flex items-center gap-1.5 text-sm text-mist mb-6 hover:text-horizon-dark transition-colors">
        <ArrowLeft size={14} /> {isRu ? "Назад" : "Артқа"}
      </Link>

      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-horizon-dark text-center mb-1">
          {isRu ? "Регистрация" : "Тіркелу"}
        </h1>
        <p className="text-sm text-mist text-center mb-6">
          {isRu ? "Уже есть аккаунт? " : "Аккаунтыңыз бар ма? "}
          <Link href={`/${lang}/login`} className="text-horizon-dark font-medium">
            {isRu ? "Вход" : "Кіру"}
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">{isRu ? "Имя" : "Аты"}</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm outline-none focus:border-horizon-dark transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">{isRu ? "Фамилия" : "Жөні"}</span>
              <input
                required
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm outline-none focus:border-horizon-dark transition-colors"
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
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm outline-none focus:border-horizon-dark transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">
              {isRu ? "Номер телефона (Whatsapp)" : "Телефон нөмірі (Whatsapp)"}
            </span>
            <input
              required
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => set("phone", formatKzPhone(e.target.value))}
              placeholder="+7 (7XX) XXX-XX-XX"
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm outline-none focus:border-horizon-dark transition-colors"
            />
            <span className="text-xs text-mist">
              {isRu ? "Принимаются только номера Казахстана" : "Тек Қазақстан нөмірлері қабылданады"}
            </span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">
              {isRu ? "Придумайте пароль" : "Құпия сөз ойлап табыңыз"}
            </span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder={isRu ? "не менее 6 символов" : "кемінде 6 таңба"}
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm outline-none focus:border-horizon-dark transition-colors"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">
              {isRu ? "Повторите пароль" : "Құпия сөзді қайталаңыз"}
            </span>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm outline-none focus:border-horizon-dark transition-colors"
            />
          </label>

          {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full cursor-pointer">
            {loading 
              ? (isRu ? "Регистрация..." : "Тіркелуде...") 
              : (isRu ? "Зарегистрироваться" : "Тіркелу")}
          </Button>
        </form>
      </div>
    </div>
  );
}