"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function GlobalLoading() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50/50 p-6 font-sans">
      <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-3xl border border-gray-100 shadow-sm">
        <span className="h-3 w-3 rounded-full bg-purple-600 animate-pulse" />
        <span className="text-sm font-semibold text-gray-600">
          {isRu ? "Загрузка…" : "Жүктелуде…"}
        </span>
      </div>
    </div>
  );
}