"use client";

import React from "react";
import { 
  MessageSquare, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  Zap,
  Users
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function StudentChatPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  return (
    <div className="w-full min-h-[calc(100vh-160px)] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center space-y-6 relative overflow-hidden">
        
        {/* Артқы фондағы сәнді градиент шұғыласы */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-200/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-200/50 rounded-full blur-3xl pointer-events-none" />

        {/* 1. БЕЙНЕ ИКОНКА */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-3xl text-white flex items-center justify-center shadow-lg shadow-purple-200 animate-bounce">
            <MessageSquare className="w-10 h-10" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* 2. МӘТІНДІК ХАБАРЛАМА */}
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
            <Sparkles className="w-3.5 h-3.5" /> {isRu ? "В разработке" : "Дайындық үстінде"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {isRu 
              ? "Интерактивный чат скоро заработает!" 
              : "Интерактивті Чат Жақында Жұмыс Бастайды!"}
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {isRu
              ? "Мы совершенствуем быструю, удобную и безопасную систему обмена сообщениями между учениками и кураторами."
              : "Біз оқушылар мен кураторлар арасындағы жылдам, ыңғайлы әрі қауіпсіз хабарлама алмасу жүйесін жетілдіріп жатырмыз."}
          </p>
        </div>

        {/* 3. БОЛАШАҚ МҮМКІНДІКТЕР КАРТОЧКАСЫ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-left">
          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-purple-600 font-bold text-xs">
              <Users className="w-4 h-4" /> {isRu ? "Групповой чат" : "Топтық чат"}
            </div>
            <p className="text-[11px] text-gray-400">
              {isRu ? "Обмен мнениями с одноклассниками" : "Сыныптастармен пікір алмасу"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
              <Zap className="w-4 h-4" /> {isRu ? "Быстрый ответ" : "Лезде жауап"}
            </div>
            <p className="text-[11px] text-gray-400">
              {isRu ? "Онлайн-помощь куратора" : "Куратордың онлайн көмегі"}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" /> {isRu ? "Объявления" : "Хабарландыру"}
            </div>
            <p className="text-[11px] text-gray-400">
              {isRu ? "Главные новости марафона" : "Марафонның басты маңызды жаңалықтары"}
            </p>
          </div>
        </div>

        {/* 4. ТӨМЕНГІ БАР */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <Clock className="w-4 h-4 text-purple-600" />
          <span>
            {isRu 
              ? "Обновление выйдет в ближайшее время. Ожидайте! 🚀" 
              : "Жаңарту жақын арада шығады. Күте тұрыңыз! 🚀"}
          </span>
        </div>

      </div>
    </div>
  );
}