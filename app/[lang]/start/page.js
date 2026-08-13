"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function StartPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. localStorage-тен рөлді алу
    const role = localStorage.getItem("user_role");

    if (!role) {
      router.replace("/login");
      return;
    }

    const normalizedRole = String(role).toUpperCase().trim();

    // 2. Жаңа таза папка құрылымына сай тура бағыттау
    switch (normalizedRole) {
      case "OWNER":
      case "SUPER_ADMIN":
        router.replace("/owner");
        break;

      case "ORGANIZER":
      case "ADMIN":
        router.replace("/org/admin");
        break;

      case "CURATOR":
      case "MENTOR":
        router.replace("/org/curator");
        break;

      case "STUDENT":
      case "PARTICIPANT":
        router.replace("/org/student");
        break;

      default:
        router.replace("/login");
        break;
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 space-y-3 font-sans text-slate-900">
      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      <p className="text-xs font-bold text-slate-500">
        {isRu ? "Перенаправление в систему..." : "Жүйеге бағытталуда..."}
      </p>
    </div>
  );
}