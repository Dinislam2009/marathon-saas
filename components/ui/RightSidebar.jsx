import React from "react";
import { Calendar, Bell, Flame, ChevronRight, Video } from "lucide-react";

export default function RightSidebar() {
  // Апталық күндердің мысалы (Streak tracker)
  const weekDays = [
    { day: "Дс", date: 20, status: "completed" },
    { day: "Сс", date: 21, status: "completed" },
    { day: "Ср", date: 22, status: "completed" },
    { day: "Бс", date: 23, status: "completed" },
    { day: "Жм", date: 24, status: "current" }, // Бүгінгі күн
    { day: "Сб", date: 25, status: "upcoming" },
    { day: "Жс", date: 26, status: "upcoming" },
  ];

  // Соңғы хабарландырулар
  const announcements = [
    {
      id: 1,
      title: "Бүгін LIVE ZOOM Вебинар!",
      desc: "Сағат 20:00-де экспертпен онлайн кездесу болады. Сұрақтарыңызды дайындап қойыңыздар.",
      time: "1 сағат бұрын",
      type: "zoom",
    },
    {
      id: 2,
      title: "1-күн дедлайны жақындауда",
      desc: "Бүгінгі тапсырманы 23:59-ға дейін өткізіп үлгеріңіз.",
      time: "3 сағат бұрын",
      type: "alert",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2-ВИДЖЕТ: Стрик / Мини-күнтізбе */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
              <Flame className="w-5 h-5 fill-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Белсенділік күнтізбесі</h3>
              <p className="text-xs text-gray-400">Тапсырманы күнде орында</p>
            </div>
          </div>
        </div>

        {/* Апталық күндер сеткасы */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekDays.map((item, index) => (
            <div
              key={index}
              className={`py-2 rounded-xl flex flex-col items-center justify-center text-xs transition-all ${
                item.status === "completed"
                  ? "bg-purple-600 text-white font-medium"
                  : item.status === "current"
                  ? "bg-purple-100 text-purple-700 border-2 border-purple-600 font-bold"
                  : "bg-gray-50 text-gray-400"
              }`}
            >
              <span className="text-[10px] opacity-80">{item.day}</span>
              <span className="text-sm">{item.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4-ВИДЖЕТ: Хабарландырулар & Жаңалықтар */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-sm">Хабарландырулар</h3>
          </div>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Жаңа
          </span>
        </div>

        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors border border-gray-100"
            >
              <div className="flex items-start gap-2.5">
                {item.type === "zoom" ? (
                  <Video className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">{item.title}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block">{item.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}