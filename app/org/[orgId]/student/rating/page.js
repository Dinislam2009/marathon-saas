"use client";

import React, { useState } from "react";
import { 
  Trophy, 
  Flame, 
  Search 
} from "lucide-react";

export default function StudentRatingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Марафон рейтингінің деректері
  const leaderboardData = [
    {
      id: 1,
      rank: 1,
      name: "Айару Нұрланова",
      group: "Альфа тобы",
      score: 1480,
      streak: 21,
      avatarColor: "bg-amber-100 text-amber-700 border-amber-400",
      badge: "🥇 1-орын",
    },
    {
      id: 2,
      rank: 2,
      name: "Арафат (Сіз)",
      group: "Альфа тобы",
      score: 1350,
      streak: 12,
      avatarColor: "bg-purple-100 text-purple-700 border-purple-300",
      badge: "🥈 2-орын",
      isMe: true,
    },
    {
      id: 3,
      rank: 3,
      name: "Ерасыл Серіков",
      group: "Бета тобы",
      score: 1290,
      streak: 18,
      avatarColor: "bg-orange-100 text-amber-900 border-amber-600/40",
      badge: "🥉 3-орын",
    },
    {
      id: 4,
      rank: 4,
      name: "Данияр Беков",
      group: "Альфа тобы",
      score: 1150,
      streak: 10,
      avatarColor: "bg-blue-100 text-blue-700 border-blue-200",
    },
    {
      id: 5,
      rank: 5,
      name: "Диана Ахметова",
      group: "Гамма тобы",
      score: 1080,
      streak: 15,
      avatarColor: "bg-pink-100 text-pink-700 border-pink-200",
    },
    {
      id: 6,
      rank: 6,
      name: "Мадина Оспанова",
      group: "Альфа тобы",
      score: 960,
      streak: 8,
      avatarColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
  ];

  // Пирамида (Пьедестал) орналасуы: 2-орын (Сол) -> 1-орын (Орта/Биік) -> 3-орын (Оң)
  const firstPlace = leaderboardData.find((u) => u.rank === 1);
  const secondPlace = leaderboardData.find((u) => u.rank === 2);
  const thirdPlace = leaderboardData.find((u) => u.rank === 3);

  const pedestalList = [
    { ...secondPlace, orderClass: "order-2 md:order-1 md:mt-8", heightClass: "md:h-[290px]" },
    { ...firstPlace, orderClass: "order-1 md:order-2 md:mt-0", heightClass: "md:h-[330px]", isTopOne: true },
    { ...thirdPlace, orderClass: "order-3 md:order-3 md:mt-12", heightClass: "md:h-[270px]" },
  ];

  const restList = leaderboardData.filter((u) => u.rank > 3);
  const filteredRestList = restList.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ФИЛЬТРЛЕР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              Лидерборд
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
              Марафон Рейтингі
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Тапсырмаларды белсенді орындап, балл жинаңыз және үздіктер қатарынан көрініңіз!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-purple-50 px-4 py-3 rounded-2xl border border-purple-100">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl font-black text-sm">
              #2
            </div>
            <div>
              <div className="text-xs text-purple-600 font-medium">Сіздің орныңыз</div>
              <div className="text-sm font-extrabold text-purple-900">1,350 Балл ⚡</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "all"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Жалпы Марафон
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                activeTab === "group"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              Тек Менің Тобым ("Альфа")
            </button>
          </div>

          <div className="relative w-full sm:w-64 hidden sm:block">
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
      </div>

      {/* 2. ПИРАМИДА (ПЬЕДЕСТАЛ) ТОП-3 БӨЛІМІ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-4">
        {pedestalList.map((user) => (
          <div
            key={user.id}
            className={`${user.orderClass} ${user.heightClass} p-6 rounded-3xl border transition-all flex flex-col items-center text-center justify-between gap-3 relative overflow-hidden ${
              user.isTopOne
                ? "bg-gradient-to-b from-amber-500/10 via-amber-50/40 to-white border-amber-300 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/30"
                : user.isMe
                ? "bg-purple-50/70 border-purple-300 shadow-md ring-2 ring-purple-600/20"
                : "bg-white border-gray-100 shadow-sm"
            }`}
          >
            {/* Бастағы тәж немесе орын көрсеткіші */}
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  user.isTopOne
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {user.badge}
              </span>
            </div>

            {/* Аватар */}
            <div className="relative my-1">
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl border-2 ${
                  user.avatarColor
                } font-black text-xl md:text-2xl flex items-center justify-center shadow-md relative`}
              >
                {user.name.charAt(0)}
              </div>
              {user.isTopOne && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 p-1.5 bg-amber-500 text-white rounded-full shadow-md">
                  <Trophy className="w-4 h-4 fill-white" />
                </div>
              )}
            </div>

            {/* Есімі & Топ */}
            <div>
              <h3 className="text-base font-extrabold text-gray-800 line-clamp-1">
                {user.name}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">{user.group}</p>
            </div>

            {/* Балл & Стрик */}
            <div className="w-full pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-auto">
              <div className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-xl">
                <Flame className="w-3.5 h-3.5 fill-orange-500" />
                {user.streak} күн
              </div>
              <div className="font-black text-purple-700 text-sm">
                {user.score} б
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. ҚАЛҒАН ОҚУШЫЛАРДЫҢ ТІЗІМІ (4-ОРЫНДАН БАСТАП) */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-800">Жалпы рейтинг тізімі</h2>

        <div className="space-y-2.5">
          {filteredRestList.map((user) => (
            <div
              key={user.id}
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <span className="w-6 text-center text-xs font-extrabold text-gray-400">
                  #{user.rank}
                </span>

                <div
                  className={`w-9 h-9 rounded-xl ${user.avatarColor} font-bold flex items-center justify-center text-xs shrink-0`}
                >
                  {user.name.charAt(0)}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-800">{user.name}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{user.group}</p>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="hidden sm:flex items-center gap-1 text-xs text-orange-600 font-bold">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  {user.streak} күн
                </div>

                <div className="text-xs font-extrabold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-xl">
                  {user.score} балл
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}