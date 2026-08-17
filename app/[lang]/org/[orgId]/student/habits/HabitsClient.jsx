"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, Flame, Plus, Trash2, X } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function HabitsClient({ studentId, initialHabits = [] }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [habits, setHabits] = useState(initialHabits);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. Әдетті белгілеу (Оптимистикалық интерфейс + Server )
  const handleToggle = async (id) => {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id === id) {
          const isDone = !habit.completedToday;
          return {
            ...habit,
            completedToday: isDone,
            streak: isDone ? (habit.streak || 0) + 1 : Math.max(0, (habit.streak || 1) - 1),
          };
        }
        return habit;
      })
    );

    try {
      const toggleFn = actions.toggleHabitToday;
      if (typeof toggleFn === "function") {
        await toggleFn(id);
      }
    } catch (e) {
      console.error("Toggle error:", e);
    }
  };

  // 2. Жаңа әдет қосу (Server )
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const addFn = actions.addHabit;
      let res = null;
      if (typeof addFn === "function") {
        res = await addFn(studentId, newTitle.trim());
      }

      const newHabitObj = res?.data || {
        id: Date.now().toString(),
        title: newTitle.trim(),
        titleRu: newTitle.trim(),
        titleKz: newTitle.trim(),
        category: isRu ? "Личная привычка" : "Жеке әдет",
        streak: 1,
        completedToday: true,
        weeklyProgress: [false, false, false, false, false, false, true],
      };

      setHabits((prev) => [...prev, newHabitObj]);
      setNewTitle("");
      setIsModalOpen(false);
    } catch (e) {
      console.error("Add habit error:", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Әдетті өшіру (Server )
  const handleDelete = async (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    try {
      const deleteFn = actions.deleteHabit;
      if (typeof deleteFn === "function") {
        await deleteFn(id);
      }
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const completedCount = habits.filter((h) => h.completedToday).length;
  const totalCount = habits.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* БӨЛІМ ШАПКАСЫ ЖӘНЕ ПРОГРЕСС БАРЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
              {isRu ? "Трекер привычек" : "Әдеттер трекері"}
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
              {isRu ? "Ежедневные привычки" : "Күнделікті Әдеттер"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRu
                ? "Дисциплина — залог победы. Выполняйте ежедневные привычки и собирайте стрики!"
                : "Тәртіп — жеңістің кепілі. Күнделікті әдеттерді орындап, стрик жинаңыз!"}
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-2xl hover:bg-purple-700 transition-all shadow-sm shadow-purple-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isRu ? "Добавить привычку" : "Жаңа әдет қосу"}
          </button>
        </div>

        {/* ПРОГРЕСС ВИДЖЕТІ */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-md shadow-purple-200 shrink-0">
              {progressPercent}%
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                {isRu 
                  ? `Сегодняшний прогресс: выполнено ${completedCount} из ${totalCount}` 
                  : `Бүгінгі прогресс: ${completedCount} / ${totalCount} орындалды`}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {progressPercent === 100
                  ? (isRu ? "Отлично! Все привычки на сегодня выполнены! 🎉" : "Керемет! Бүгінгі барлық әдеттер толық орындалды! 🎉")
                  : (isRu ? "Отметьте оставшиеся привычки, чтобы достичь дневной цели." : "Күндік мақсатқа жету үшін қалған әдеттерді белгілеңіз.")}
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

      {/* ӘДЕТТЕР ТІЗІМІ */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {isRu ? "Чек-лист на сегодня" : "Бүгінгі чек-лист"}
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            {isRu ? "Недельная активность" : "Апталық белсенділік"}
          </span>
        </div>

        <div className="space-y-3">
          {habits.map((habit) => {
            const displayTitle = isRu ? (habit.titleRu || habit.title) : (habit.titleKz || habit.title);
            const displayCategory = isRu ? (habit.categoryRu || habit.category || "Привычка") : (habit.categoryKz || habit.category || "Әдет");

            return (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                  habit.completedToday
                    ? "bg-purple-50/40 border-purple-200"
                    : "bg-gray-50/50 border-gray-100 hover:bg-white hover:border-gray-200"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <button onClick={() => handleToggle(habit.id)} className="transition-transform active:scale-95 cursor-pointer">
                    {habit.completedToday ? (
                      <CheckCircle2 className="w-6 h-6 text-purple-600 fill-purple-100" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300 hover:text-purple-600" />
                    )}
                  </button>

                  <div>
                    <h3 className={`text-sm font-bold transition-all ${habit.completedToday ? "line-through text-gray-400" : "text-gray-800"}`}>
                      {displayTitle}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">{displayCategory}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    <span className="text-xs font-bold text-orange-700">
                      {habit.streak || 0} {isRu ? "дней" : "күн"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {(habit.weeklyProgress || [true, true, true, true, true, true, true]).map((isDone, idx) => (
                      <span
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full ${isDone ? "bg-purple-600" : "bg-gray-200"}`}
                      ></span>
                    ))}
                  </div>

                  <button
                    onClick={() => handleDelete(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1 cursor-pointer"
                    title={isRu ? "Удалить" : "Өшіру"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ЖАҢА ӘДЕТ ҚОСУ МОДАЛІ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-800">
                {isRu ? "Добавить новую привычку" : "Жаңа Әдет Қосу"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">
                  {isRu ? "Название привычки:" : "Әдет атауы:"}
                </label>
                <input
                  type="text"
                  placeholder={isRu ? "Например: Прочитать 10 страниц книги" : "Мысалы: 10 бет кітап оқу"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  {isRu ? "Отмена" : "Бас тарту"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading 
                    ? (isRu ? "Сохранение..." : "Сақталуда...") 
                    : (isRu ? "Добавить" : "Қосу")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}