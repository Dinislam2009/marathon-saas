"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
      setError("Бұл email немесе телефон нөмірімен аккаунт бар болып тұр.");
      return;
    }

    const { user } = registerUser(form);
    router.push(`/verify-otp?uid=${user.id}`);
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-8">
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-mist mb-6">
        <ArrowLeft size={14} /> Артқа
      </Link>

      <div className="max-w-sm mx-auto">
        <h1 className="font-display text-2xl font-semibold text-horizon-dark text-center mb-1">
          Тіркелу
        </h1>
        <p className="text-sm text-mist text-center mb-6">
          Аккаунтыңыз бар ма?{" "}
          <Link href="/login" className="text-horizon-dark font-medium">
            Кіру
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Аты</span>
              <input
                required
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-ink">Тегі</span>
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
            <span className="font-medium text-ink">Телефон нөмірі</span>
            <input
              required
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => set("phone", formatKzPhone(e.target.value))}
              placeholder="+7 (7XX) XXX-XX-XX"
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
            <span className="text-xs text-mist">Тек Қазақстан нөмірлері қабылданады</span>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Құпия сөз орнату</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="кемінде 6 таңба"
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Құпия сөзді қайталаңыз</span>
            <input
              required
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              className="rounded-xl border border-mist-light px-3.5 py-3 text-sm"
            />
          </label>

          {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

          <Button type="submit" size="lg" className="mt-2 w-full">
            Тіркелу
          </Button>
        </form>
      </div>
    </div>
  );
}
