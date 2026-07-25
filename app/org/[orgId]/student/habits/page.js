"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Plus, 
  Sparkles, 
  Target, 
  TrendingUp, 
  Calendar 
} from "lucide-react";

export default function StudentHabitsPage() {
  // Әдеттердің базалық тізімі (useState арқылы интерактивті басуға болады)
  const [habits, setHabits] = useState([
    {
      id: 1,
      title: "Ерте тұру (07:00)",
      category: "Денсаулық & Тәртіп",
      streak: 14,
      completedToday: true,
      weeklyProgress: [true, true, true, true, true, true, true],
    },
    {
      id: 2,
      title: "20 минут кітап / конспект оқу",
      category: "Оқу & Даму",
      streak: 8,
      completedToday: true,
      weeklyProgress: [true, false, true, true, true, true, true],
    },
    {
      id: 3,
      title: "Информатика: 15 тест орындау",
      category: "Марафон тапсырмасы",
      streak: 5,
      completedToday: false,
      weeklyProgress: [true, true, false, true, true, true, false],
    },
    {
      id: 4,
      title: "Математика: 5 формула жаттау",
      category: "Марафон тапсырмасы",
      streak: 12,
      completedToday: false,
      weeklyProgress: [true, true, true, true, true, false, false],
    },
  ]);

  // Бүгінгі әдетті орындалды/орындалмады қылып ауыстыру
  const toggleHabit = (id) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          const isDone = !habit.completedToday;
          return {
            ...habit,
            completedToday: isDone,
            streak: isDone ? habit.streak + 1 : Math.max(0, habit.streak - 1),
          };
        }
        return habit;
      })
    );
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6 w-full">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ПРОГРЕСС БАРЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
              Әдеттер трекері
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
              Күнделікті Әдеттер
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Тәртіп — жеңістің кепілі. Күнделікті әдеттерді орындап, стрик жинаңыз!
            </p>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-2xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200">
            <Plus className="w-4 h-4" />
            Жаңа әдет қосу
          </button>
        </div>

        {/* БҮГІНГІ ПРОГРЕСС ВИДЖЕТІ */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-md shadow-purple-200">
              {progressPercent}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Бүгінгі прогресс: {completedCount} / {totalCount} орындалды
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {progressPercent === 100
                  ? "Керемет! Бүгінгі барлық әдеттер толық орындалды! 🎉"
                  : "Күндік мақсатқа жету үшін қалған әдеттерді белгілеңіз."}
              </p>
            </div>
          </div>

          <div className="w-full md:w-48 bg-white/80 rounded-full h-3 p-0.5 border border-purple-100 overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. ӘДЕТТЕР ТІЗІМІ */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-800">Бүгінгі чек-лист</h2>
          <span className="text-xs text-gray-400 font-medium">
            Апталық белсенділік
          </span>
        </div>

        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                habit.completedToday
                  ? "bg-purple-50/40 border-purple-200"
                  : "bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200"
              }`}
            >
              {/* Сол жақ: Чекбокс & Атауы */}
              <div className="flex items-center gap-3.5">
                <button
                  onClick={() => toggleHabit(habit.id)}
                  className="transition-transform active:scale-95"
                >
                  {habit.completedToday ? (
                    <CheckCircle2 className="w-6 h-6 text-purple-600 fill-purple-100" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 hover:text-purple-600" />
                  )}
                </button>

                <div>
                  <h3
                    className={`text-sm font-bold transition-all ${
                      habit.completedToday
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {habit.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {habit.category}
                  </p>
                </div>
              </div>

              {/* Оң жақ: Стрик & Апталық күндер көрсеткіші */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {/* Стрик */}
                <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                  <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                  <span className="text-xs font-bold text-orange-700">
                    {habit.streak} күн
                  </span>
                </div>

                {/* Апталық 7 күннің нүктелері */}
                <div className="flex items-center gap-1">
                  {habit.weeklyProgress.map((isDone, idx) => (
                    <span
                      key={idx}
                      className={`w-2.5 h-2.5 rounded-full ${
                        isDone ? "bg-purple-600" : "bg-gray-200"
                      }`}
                      title={`Күн ${idx + 1}`}
                    ></span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}