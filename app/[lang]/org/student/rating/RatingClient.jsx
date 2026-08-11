"use client";

import React, { useState } from "react";
import { Trophy, Flame, Search, Users } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function RatingClient({ initialLeaderboard = [], currentStudent = null }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Шынайы топ немесе марафон атауы
  const defaultGroup = isRu ? "Не прикреплён к группе" : "Топқа бекітілмеген";
  const myGroup = (currentStudent?.group && currentStudent.group !== "Альфа тобы")
    ? currentStudent.group 
    : (currentStudent?.marathon?.title || defaultGroup);

  // Таб пен Іздеу бойынша сүзгілеу
  const filteredList = initialLeaderboard.filter((user) => {
    const userGroup = user.group || defaultGroup;
    const matchesTab = activeTab === "all" || userGroup === myGroup;
    const matchesSearch = user.rawName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // ТОП-3 оқушыны бөліп алу
  const firstPlace = filteredList.find((u) => u.rank === 1);
  const secondPlace = filteredList.find((u) => u.rank === 2);
  const thirdPlace = filteredList.find((u) => u.rank === 3);

  const firstStyle = firstPlace
    ? {
        ...firstPlace,
        badge: isRu ? "🥇 1-место" : "🥇 1-орын",
        avatarColor: "bg-amber-100 text-amber-700 border-amber-400",
        orderClass: "order-1 md:order-2 md:mt-0",
        heightClass: "md:h-[330px]",
        isTopOne: true,
      }
    : null;

  const secondStyle = secondPlace
    ? {
        ...secondPlace,
        badge: isRu ? "🥈 2-место" : "🥈 2-орын",
        avatarColor: "bg-purple-100 text-purple-700 border-purple-300",
        orderClass: "order-2 md:order-1 md:mt-8",
        heightClass: "md:h-[290px]",
      }
    : null;

  const thirdStyle = thirdPlace
    ? {
        ...thirdPlace,
        badge: isRu ? "🥉 3-место" : "🥉 3-орын",
        avatarColor: "bg-orange-100 text-amber-900 border-amber-600/40",
        orderClass: "order-3 md:order-3 md:mt-12",
        heightClass: "md:h-[270px]",
      }
    : null;

  const pedestalList = [secondStyle, firstStyle, thirdStyle].filter(Boolean);

  // 4-орыннан бастап төменгі тізім
  const restList = filteredList.filter((u) => u.rank > 3);

  const myRankObj = initialLeaderboard.find((u) => u.isMe);

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ФИЛЬТРЛЕР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              {isRu ? "Лидерборд" : "Лидерборд"}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
              {isRu ? "Рейтинг марафона" : "Марафон Рейтингі"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRu
                ? "Активно выполняйте задания, собирайте баллы и будьте среди лучших!"
                : "Тапсырмаларды белсенді орындап, балл жинаңыз және үздіктер қатарынан көрініңіз!"}
            </p>
          </div>

          {myRankObj && (
            <div className="flex items-center gap-3 bg-purple-50 px-4 py-3 rounded-2xl border border-purple-100 shrink-0">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl font-black text-sm">
                #{myRankObj.rank}
              </div>
              <div>
                <div className="text-xs text-purple-600 font-medium">
                  {isRu ? "Ваше место" : "Сіздің орныңыз"}
                </div>
                <div className="text-sm font-extrabold text-purple-900">
                  {myRankObj.score} {isRu ? "Баллов ⚡" : "Балл ⚡"}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "all"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isRu ? "Общий марафон" : "Жалпы Марафон"}
            </button>
            <button
              onClick={() => setActiveTab("group")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === "group"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isRu ? `Только моя группа ("${myGroup}")` : `Тек Менің Тобым ("${myGroup}")`}
            </button>
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
      </div>

      {/* 2. ПИРАМИДА (ПЬЕДЕСТАЛ) ТОП-3 БӨЛІМІ */}
      {pedestalList.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-3">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-700">
            {isRu ? "Ученики не найдены" : "Оқушылар табылмады"}
          </h3>
          <p className="text-xs text-gray-400">
            {isRu
              ? "В базе пока нет зарегистрированных учеников или результат поиска пуст"
              : "Базада әлі тіркелген оқушылар жоқ немесе іздеу нәтижесі бос"}
          </p>
        </div>
      ) : (
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

              <div className="relative my-1">
                <div
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl border-2 ${
                    user.avatarColor || "bg-purple-100 text-purple-700"
                  } font-black text-xl md:text-2xl flex items-center justify-center shadow-md relative`}
                >
                  {user.rawName.charAt(0)}
                </div>
                {user.isTopOne && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 p-1.5 bg-amber-500 text-white rounded-full shadow-md">
                    <Trophy className="w-4 h-4 fill-white" />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-base font-extrabold text-gray-800 line-clamp-1">
                  {user.name}{user.isMe ? (isRu ? " (Вы)" : " (Сіз)") : ""}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{user.group || defaultGroup}</p>
              </div>

              <div className="w-full pt-3 border-t border-gray-100 flex items-center justify-between text-xs mt-auto">
                <div className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2.5 py-1 rounded-xl">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" />
                  {user.streak} {isRu ? "дней" : "күн"}
                </div>
                <div className="font-black text-purple-700 text-sm">
                  {user.score} {isRu ? "б" : "б"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. ҚАЛҒАН ОҚУШЫЛАРДЫҢ ТІЗІМІ (4-ОРЫНДАН БАСТАП) */}
      {restList.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-800">
            {isRu ? "Общий список рейтинга" : "Жалпы рейтинг тізімі"}
          </h2>

          <div className="space-y-2.5">
            {restList.map((user) => (
              <div
                key={user.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  user.isMe
                    ? "bg-purple-50/70 border-purple-200 shadow-sm"
                    : "border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-center text-xs font-extrabold text-gray-400 shrink-0">
                    #{user.rank}
                  </span>

                  <div
                    className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0"
                  >
                    {user.rawName.charAt(0)}
                  </div>

                  <div className="truncate">
                    <h3 className="text-xs font-bold text-gray-800 truncate">
                      {user.name}{user.isMe ? (isRu ? " (Вы)" : " (Сіз)") : ""}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{user.group || defaultGroup}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-xs text-orange-600 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    {user.streak} {isRu ? "дней" : "күн"}
                  </div>

                  <div className="text-xs font-extrabold text-gray-800 bg-gray-100 px-3 py-1.5 rounded-xl">
                    {user.score} {isRu ? "баллов" : "балл"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}