"use client";

import React, { useState } from "react";
import { Link as LinkIcon, Check, Copy } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RefLinksPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  const [copied, setCopied] = useState(false);

  const managerId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") || "mgr1" : "mgr1";
  const refUrl = typeof window !== "undefined" ? `${window.location.origin}/${lang}/register?ref=${managerId}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 p-8 rounded-3xl shadow-xs space-y-4 max-w-xl font-sans text-slate-900">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
          <LinkIcon size={24} />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">{isRu ? "Ваша Персональная Ссылка" : "Сіздің Жеке Сілтемеңіз"}</h2>
          <p className="text-xs text-slate-500">{isRu ? "Отправьте ссылку ученику. Все покупки будут автоматически засчитаны вам." : "Оқушыға осы сілтемені жіберіңіз. Оның сатылымы сізге жазылады."}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
        <input
          type="text"
          readOnly
          value={refUrl}
          className="w-full bg-transparent px-3 text-xs font-mono font-bold text-purple-700 outline-none"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl transition cursor-pointer shrink-0"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? (isRu ? "Скопировано!" : "Көшірілді!") : (isRu ? "Копировать" : "Көшіру")}
        </button>
      </div>
    </div>
  );
}