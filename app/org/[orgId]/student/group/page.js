"use client";

import React, { useState } from "react";
import { 
  Users, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Search, 
  MessageCircle, 
  CheckCircle2, 
  Clock 
} from "lucide-react";

export default function StudentGroupPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Мысал ретінде топ мүшелерінің деректері
  const groupMembers = [
    {
      id: 1,
      name: "Айару Нұрланова",
      role: "Капитан 👑",
      streak: 21,
      tasksDone: "100%",
      avatarColor: "bg-purple-100 text-purple-700",
      status: "online",
      rank: 1,
    },
    {
      id: 2,
      name: "Арафат (Сіз)",
      role: "Студент",
      streak: 12,
      tasksDone: "85%",
      avatarColor: "bg-indigo-100 text-indigo-700",
      status: "online",
      rank: 2,
      isMe: true,
    },
    {
      id: 3,
      name: "Данияр Беков",
      role: "Студент",
      streak: 10,
      tasksDone: "80%",
      avatarColor: "bg-blue-100 text-blue-700",
      status: "offline",
      rank: 3,
    },
    {
      id: 4,
      name: "Мадина Оспанова",
      role: "Студент",
      streak: 8,
      tasksDone: "70%",
      avatarColor: "bg-pink-100 text-pink-700",
      status: "offline",
      rank: 4,
    },
    {
      id: 5,
      name: "Сұңқар Әлібеков",
      role: "Студент",
      streak: 5,
      tasksDone: "50%",
      avatarColor: "bg-emerald-100 text-emerald-700",
      status: "offline",
      rank: 5,
    },
  ];

  const filteredMembers = groupMembers.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ТОП СТАТИСТИКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                Топ №4
              </span>
              <span className="text-xs text-gray-400">Информатика & Математика</span>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-1">
              "Альфа" Тобы
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Куратор: <strong className="text-gray-800">Сымбат апай</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-2xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
              <MessageCircle className="w-4 h-4" />
              Топ чатына өту
            </button>
          </div>
        </div>

        {/* ТОП СТАТИСТИКАСЫ КАРТОЧКАЛАРЫ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Студенттер</div>
              <div className="text-lg font-extrabold text-gray-800">12 Оқушы</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Орташа Стрик</div>
              <div className="text-lg font-extrabold text-gray-800">11 Күн</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Үлгерім</div>
              <div className="text-lg font-extrabold text-gray-800">88%</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-gray-400 font-medium">Топ Раңқы</div>
              <div className="text-lg font-extrabold text-gray-800">2-Орын 🥈</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ТҮЗІМ ЖӘНЕ МҮШЕЛЕР ТІЗІМІ */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Топ Мүшелері</h2>
            <p className="text-xs text-gray-400">Студенттердің белсенділігі мен рейтингі</p>
          </div>

          {/* Іздеу жолы */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Студентті іздеу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
            />
          </div>
        </div>

        {/* КЕСТЕ / СТУДЕНТТЕР ТІЗІМІ */}
        <div className="space-y-3 pt-2">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                member.isMe
                  ? "bg-purple-50/60 border-purple-200 shadow-sm"
                  : "bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200"
              }`}
            >
              {/* Сол жақ: Орын, Аватар, Есім */}
              <div className="flex items-center gap-3.5">
                <span className={`w-6 text-center text-xs font-extrabold ${
                  member.rank === 1 ? "text-amber-500 text-sm" :
                  member.rank === 2 ? "text-gray-400 text-sm" :
                  member.rank === 3 ? "text-amber-700 text-sm" : "text-gray-400"
                }`}>
                  #{member.rank}
                </span>

                <div className={`w-10 h-10 rounded-2xl ${member.avatarColor} font-bold flex items-center justify-center text-sm relative shrink-0`}>
                  {member.name.charAt(0)}
                  {member.status === "online" && (
                    <span className="w-3 h-3 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5"></span>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      {member.name}
                    </h3>
                    {member.isMe && (
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-md">
                        Сіз
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{member.role}</p>
                </div>
              </div>

              {/* Оң жақ: Стрик пен Орындау пайыз көрсеткіші */}
              <div className="flex items-center gap-6">
                <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-orange-700">{member.streak} күн</span>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-gray-800">{member.tasksDone}</div>
                  <div className="text-[10px] text-gray-400">Орындалуы</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}