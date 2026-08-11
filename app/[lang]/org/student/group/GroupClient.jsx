"use client";

import React, { useState } from "react";
import { 
  Users, 
  Trophy, 
  Flame, 
  Search, 
  MessageCircle, 
  CheckCircle2 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function GroupClient({ initialData }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [searchTerm, setSearchTerm] = useState("");

  const members = initialData?.members || [];
  const curatorName = initialData?.curatorName || (isRu ? "Куратор не назначен" : "Куратор тағайындалмаған");
  const groupTitle = initialData?.groupTitle || (isRu ? "Не прикреплён к группе" : "Топқа бекітілмеген");
  const marathonTitle = initialData?.marathonTitle || (isRu ? "Марафон" : "Марафон");

  // Нақты статистика
  const totalStudents = members.length;
  const avgStreak = totalStudents > 0 
    ? Math.round(members.reduce((acc, m) => acc + m.streak, 0) / totalStudents) 
    : 0;

  const filteredMembers = members.filter((m) =>
    m.rawName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ТОП СТАТИСТИКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                {isRu ? "Активная группа" : "Белсенді Топ"}
              </span>
              <span className="text-xs text-gray-400 font-medium">{marathonTitle}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
              {groupTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRu ? "Куратор: " : "Куратор: "}<strong className="text-gray-800">{curatorName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-2xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 cursor-pointer">
              <MessageCircle className="w-4 h-4" />
              {isRu ? "Перейти в чат группы" : "Топ чатына өту"}
            </button>
          </div>
        </div>

        {/* НАҚТЫ СТАТИСТИКА КАРТОЧКАЛАРЫ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">{isRu ? "Студенты" : "Студенттер"}</div>
              <div className="text-lg font-extrabold text-gray-800">
                {totalStudents} {isRu ? "учеников" : "Оқушы"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">{isRu ? "Средний стрик" : "Орташа Стрик"}</div>
              <div className="text-lg font-extrabold text-gray-800">
                {avgStreak} {isRu ? "дней" : "Күн"}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">{isRu ? "Ежедневный отчёт" : "Күнделікті есеп"}</div>
              <div className="text-lg font-extrabold text-gray-800">{isRu ? "Активно" : "Белсенді"}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">{isRu ? "Ранг группы" : "Топ Раңқы"}</div>
              <div className="text-lg font-extrabold text-gray-800">{isRu ? "Лидер 🏆" : "Лидер 🏆"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. НАҚТЫ СТУДЕНТТЕР ТІЗІМІ */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{isRu ? "Участники группы" : "Топ Мүшелері"}</h2>
            <p className="text-xs text-gray-400">{isRu ? "Ученики, обучающиеся в этой группе" : "Осы топта бірге оқып жатқан оқушылар"}</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={isRu ? "Поиск студента..." : "Студентті іздеу..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">
              {isRu ? "Студенты не найдены" : "Студенттер табылмады"}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  member.isMe
                    ? "bg-purple-50/60 border-purple-200 shadow-sm"
                    : "bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={`w-6 text-center text-xs font-extrabold ${
                    member.rank === 1 ? "text-amber-500 text-sm" :
                    member.rank === 2 ? "text-gray-400 text-sm" :
                    member.rank === 3 ? "text-amber-700 text-sm" : "text-gray-400"
                  }`}>
                    #{member.rank}
                  </span>

                  <div className={`w-10 h-10 rounded-2xl ${member.avatarColor} font-bold flex items-center justify-center text-sm relative shrink-0`}>
                    {member.rawName.charAt(0)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800">
                        {member.name}{member.isMe ? (isRu ? " (Вы)" : " (Сіз)") : ""}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {member.roleIndex === 1 ? (isRu ? "Капитан 👑" : "Капитан 👑") : (isRu ? "Студент" : "Студент")} • {member.points} {isRu ? "баллов" : "балл"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="text-xs font-bold text-orange-700">
                      {member.streak} {isRu ? "дней" : "күн"}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-gray-800">
                      {member.tasksCount} {isRu ? "заданий" : "есеп"}
                    </div>
                    <div className="text-[10px] text-gray-400">{isRu ? "Сдано" : "Тапсырылды"}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}