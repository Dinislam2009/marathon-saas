"use client";

import React, { useState } from "react";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Circle 
} from "lucide-react";
import { addMatrixTask, toggleMatrixTaskDone, deleteMatrixTask } from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function MatrixClient({ studentId, initialTasks = [] }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskText, setNewTaskText] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState("do");
  const [loading, setLoading] = useState(false);

  // 1. Тапсырманы орындалды деп белгілеу
  const toggleTask = async (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    try {
      await toggleMatrixTaskDone(id);
    } catch (e) {
      console.error("Toggle matrix task error:", e);
    }
  };

  // 2. Тапсырманы өшіру
  const deleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteMatrixTask(id);
    } catch (e) {
      console.error("Delete matrix task error:", e);
    }
  };

  // 3. Жаңа тапсырма қосу
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    setLoading(true);

    try {
      const res = await addMatrixTask(studentId, {
        title: newTaskText.trim(),
        quadrant: selectedQuadrant,
      });

      const addedObj = res?.data || {
        id: Date.now().toString(),
        title: newTaskText.trim(),
        quadrant: selectedQuadrant,
        completed: false,
      };

      setTasks((prev) => [...prev, addedObj]);
      setNewTaskText("");
    } catch (e) {
      console.error("Add matrix task error:", e);
    } finally {
      setLoading(false);
    }
  };

  const quadrants = [
    {
      id: "do",
      title: isRu ? "1. Сделать (Do First)" : "1. Орындау (Do First)",
      subtitle: isRu ? "Срочно & Важно" : "Шұғыл & Маңызды",
      color: "bg-red-50/50 border-red-200 text-red-700",
      badgeColor: "bg-red-600 text-white",
      icon: AlertCircle,
    },
    {
      id: "schedule",
      title: isRu ? "2. Запланировать (Schedule)" : "2. Жоспарлау (Schedule)",
      subtitle: isRu ? "Не срочно & Важно" : "Шұғыл емес & Маңызды",
      color: "bg-purple-50/50 border-purple-200 text-purple-700",
      badgeColor: "bg-purple-600 text-white",
      icon: Calendar,
    },
    {
      id: "delegate",
      title: isRu ? "3. Делегировать (Delegate)" : "3. Делегаттау (Delegate)",
      subtitle: isRu ? "Срочно & Не важно" : "Шұғыл & Маңызды емес",
      color: "bg-amber-50/50 border-amber-200 text-amber-700",
      badgeColor: "bg-amber-600 text-white",
      icon: Clock,
    },
    {
      id: "eliminate",
      title: isRu ? "4. Удалить (Don't Do)" : "4. Жою (Don't Do)",
      subtitle: isRu ? "Не срочно & Не важно" : "Шұғыл емес & Маңызды емес",
      color: "bg-gray-50/50 border-gray-200 text-gray-700",
      badgeColor: "bg-gray-600 text-white",
      icon: Trash2,
    },
  ];

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
            {isRu ? "Тайм-менеджмент" : "Тайм-менеджмент"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {isRu ? "Матрица Эйзенхауэра" : "Эйзенхауэр Матрицасы"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRu 
              ? "Сортируйте свои задачи по важности и срочности, эффективно управляя временем." 
              : "Тапсырмаларыңызды маңыздылығы мен шұғылдығына қарай сұрыптап, уақытыңызды тиімді басқарыңыз."}
          </p>
        </div>

        {/* ТАПСЫРМА ҚОСУ ФОРМАСЫ */}
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder={isRu ? "Напишите новую задачу..." : "Жаңа тапсырма жазыңыз..."}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
            required
          />

          <select
            value={selectedQuadrant}
            onChange={(e) => setSelectedQuadrant(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-600 transition-colors cursor-pointer"
          >
            <option value="do">🔴 {isRu ? "1. Срочно & Важно" : "1. Шұғыл & Маңызды"}</option>
            <option value="schedule">🟣 {isRu ? "2. Не срочно & Важно" : "2. Шұғыл емес & Маңызды"}</option>
            <option value="delegate">🟡 {isRu ? "3. Срочно & Не важно" : "3. Шұғыл & Маңызды емес"}</option>
            <option value="eliminate">⚪ {isRu ? "4. Не срочно & Не важно" : "4. Шұғыл емес & Маңызды емес"}</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-2xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {loading ? (isRu ? "Добавление..." : "Қосылуда...") : (isRu ? "Добавить" : "Қосу")}
          </button>
        </form>
      </div>

      {/* 2. МАТРИЦА СЕТКАСЫ (4 КВАДРАТ) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map((q) => {
          const Icon = q.icon;
          const qTasks = tasks.filter((t) => t.quadrant === q.id);

          return (
            <div
              key={q.id}
              className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 bg-white ${q.color}`}
            >
              <div className="space-y-3">
                {/* Квадрат Шапкасы */}
                <div className="flex items-center justify-between border-b border-gray-100/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${q.badgeColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-800">
                        {q.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {q.subtitle}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-2.5 py-1 bg-white/80 rounded-xl border border-gray-100 text-gray-600">
                    {qTasks.length}
                  </span>
                </div>

                {/* Тапсырмалар тізімі */}
                <div className="space-y-2 min-h-[120px]">
                  {qTasks.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center text-gray-400 text-xs font-medium">
                      {isRu ? "Задач нет" : "Тапсырмалар жоқ"}
                    </div>
                  ) : (
                    qTasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-3 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="shrink-0 transition-transform active:scale-95 cursor-pointer"
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-purple-600 fill-purple-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 hover:text-purple-600" />
                            )}
                          </button>
                          <span
                            className={`text-xs font-bold truncate ${
                              task.completed
                                ? "line-through text-gray-400"
                                : "text-gray-800"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 cursor-pointer"
                          title={isRu ? "Удалить" : "Өшіру"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}