"use client";

import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Video, 
  BookOpen 
} from "lucide-react";

export default function StudentCalendarPage() {
  const [currentDate] = useState(new Date(2026, 6, 1));

  const daysData = {
    "2026-07-01": { status: "completed", title: "1-күн: Старт & Мақсат қою", tasksCount: "3/3" },
    "2026-07-02": { status: "completed", title: "2-күн: Әдеттер матрицасы", tasksCount: "2/2" },
    "2026-07-03": { status: "completed", title: "3-күн: Уақытты жоспарлау", tasksCount: "4/4" },
    "2026-07-04": { status: "completed", title: "4-күн: Информатика базасы", tasksCount: "3/3" },
    "2026-07-05": { status: "rest", title: "Демалыс күні 🌿", tasksCount: "0/0" },
    "2026-07-25": { status: "today", title: "Бүгін: Математикалық сауаттылық", tasksCount: "1/3", hasZoom: true },
    "2026-07-26": { status: "upcoming", title: "22-күн: Интенсив тест", tasksCount: "0/2" },
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Күнтізбе & Кесте</h1>
          <p className="text-sm text-gray-500 mt-1">Марафон тапсырмалары, дедлайндар мен LIVE сабақтар кестесі</p>
        </div>
        
        <div className="flex items-center gap-3 bg-orange-50 px-4 py-2.5 rounded-2xl border border-orange-100">
          <div className="p-2 bg-orange-500 text-white rounded-xl">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="text-xs text-orange-600 font-medium">Қатар тұрған күн</div>
            <div className="text-base font-extrabold text-orange-900">12 Күн 🔥</div>
          </div>
        </div>
      </div>

      {/* 2. НЕГІЗГІ СЕТКА */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* СОЛ ЖАҚ: КАЛЕНДАРЬ */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Шілде 2026</h2>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"].map((day, idx) => (
              <div key={idx} className="text-xs font-bold text-gray-400 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNumber = i + 1;
              const dateStr = `2026-07-${dayNumber < 10 ? "0" + dayNumber : dayNumber}`;
              const dayInfo = daysData[dateStr];

              return (
                <div
                  key={i}
                  className={`min-h-[70px] p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    dayNumber === 25
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200"
                      : dayInfo?.status === "completed"
                      ? "bg-purple-50/60 border-purple-100 text-gray-800 hover:border-purple-300"
                      : dayInfo?.status === "rest"
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                      : "bg-gray-50/50 border-gray-100 text-gray-700 hover:bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold ${dayNumber === 25 ? "text-white" : "text-gray-700"}`}>
                      {dayNumber}
                    </span>
                    {dayInfo?.status === "completed" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    {dayInfo?.hasZoom && (
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
                    )}
                  </div>

                  {dayInfo && (
                    <div className="mt-1">
                      <p className={`text-[10px] line-clamp-1 font-medium ${
                        dayNumber === 25 ? "text-purple-100" : "text-gray-500"
                      }`}>
                        {dayInfo.title}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-600"></span>
              <span>Бүгінгі күн</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-100 border border-purple-200"></span>
              <span>Орындалған күн</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200"></span>
              <span>Демалыс</span>
            </div>
          </div>
        </div>

        {/* ОҢ ЖАҚ: ТАҢДАЛҒАН КҮНДІҢ ТАПСЫРМАЛАРЫ */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">25 Шілде, 2026</span>
                <h3 className="text-base font-bold text-gray-800 mt-0.5">Күннің бағдарламасы</h3>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                21-Күн
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">LIVE Вебинар</span>
                <span className="text-xs text-purple-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 20:00
                </span>
              </div>
              <h4 className="font-bold text-sm">Сарапшымен онлайн кездесу</h4>
              <p className="text-xs text-purple-100">Нұсқа талдау және сұрақ-жауап сессиясы</p>
              <button className="w-full mt-2 py-2 bg-white text-purple-700 text-xs font-bold rounded-xl hover:bg-purple-50 transition-colors">
                Zoom-ға қосылу
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Күндік чек-лист</h4>
              
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Бейнесабақты қарау</h5>
                    <p className="text-[11px] text-gray-400">15 минут</p>
                  </div>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-1 rounded-lg">
                  Орындалды
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Тест тапсырмасы</h5>
                    <p className="text-[11px] text-gray-400">10 сұрақ</p>
                  </div>
                </div>
                <button className="text-xs bg-purple-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-purple-700">
                  Орындау
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}