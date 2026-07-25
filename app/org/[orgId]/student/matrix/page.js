"use client";

import React, { useState } from "react";
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  Circle,
  Sparkles
} from "lucide-react";

export default function StudentMatrixPage() {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "Информатика: Проектті өткізу",
      quadrant: "do", // Шұғыл & Маңызды
      completed: false,
    },
    {
      id: 2,
      title: "Математика: ҰБТ формулаларын қайталау",
      quadrant: "schedule", // Шұғыл емес & Маңызды
      completed: false,
    },
    {
      id: 3,
      title: "Почтаны / Мессенджердегі хабарламаларды тексеру",
      quadrant: "delegate", // Шұғыл & Маңызды емес
      completed: false,
    },
    {
      id: 4,
      title: "Социальные сети / Тікток қарау",
      quadrant: "eliminate", // Шұғыл емес & Маңызды емес
      completed: true,
    },
  ]);

  const [newTaskText, setNewTaskText] = useState("");
  const [selectedQuadrant, setSelectedQuadrant] = useState("do");

  const toggleTask = (id) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now(),
      title: newTaskText,
      quadrant: selectedQuadrant,
      completed: false,
    };

    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const quadrants = [
    {
      id: "do",
      title: "1. Орындау (Do First)",
      subtitle: "Шұғыл & Маңызды",
      color: "bg-red-50 border-red-200 text-red-700",
      badgeColor: "bg-red-600 text-white",
      icon: AlertCircle,
    },
    {
      id: "schedule",
      title: "2. Жоспарлау (Schedule)",
      subtitle: "Шұғыл емес & Маңызды",
      color: "bg-purple-50 border-purple-200 text-purple-700",
      badgeColor: "bg-purple-600 text-white",
      icon: Calendar,
    },
    {
      id: "delegate",
      title: "3. Делегаттау (Delegate)",
      subtitle: "Шұғыл & Маңызды емес",
      color: "bg-amber-50 border-amber-200 text-amber-700",
      badgeColor: "bg-amber-600 text-white",
      icon: Clock,
    },
    {
      id: "eliminate",
      title: "4. Жою (Don't Do)",
      subtitle: "Шұғыл емес & Маңызды емес",
      color: "bg-gray-50 border-gray-200 text-gray-700",
      badgeColor: "bg-gray-600 text-white",
      icon: Trash2,
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
            Тайм-менеджмент
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            Эйзенхауэр Матрицасы
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Тапсырмаларыңызды маңыздылығы мен шұғылдығына қарай сұрыптап, уақытыңызды тиімді басқарыңыз.
          </p>
        </div>

        {/* ТАПСЫРМА ҚОСУ ФОРМАСЫ */}
        <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
          <input
            type="text"
            placeholder="Жаңа тапсырма жазыңыз..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-purple-600 transition-colors"
          />

          <select
            value={selectedQuadrant}
            onChange={(e) => setSelectedQuadrant(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:border-purple-600 transition-colors cursor-pointer"
          >
            <option value="do">🔴 1. Шұғыл & Маңызды</option>
            <option value="schedule">🟣 2. Шұғыл емес & Маңызды</option>
            <option value="delegate">🟡 3. Шұғыл & Маңызды емес</option>
            <option value="eliminate">⚪ 4. Шұғыл емес & Маңызды емес</option>
          </select>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-2xl hover:bg-purple-700 transition-colors shadow-sm shadow-purple-200 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Қосу
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
                      Тапсырмалар жоқ
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
                            className="shrink-0 transition-transform active:scale-95"
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
                          className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
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