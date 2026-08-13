"use client";

import React, { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Video, 
  BookOpen,
  Calendar as CalendarIcon,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const MONTH_NAMES_KZ = [
  "Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым",
  "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"
];

const MONTH_NAMES_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

export default function StudentCalendarPage({ initialTasks = {}, streakCount = 12 }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const monthNames = isRu ? MONTH_NAMES_RU : MONTH_NAMES_KZ;
  const weekDays = isRu ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] : ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"];

  // 1. Ағымдағы ашылып тұрған ай және таңдалған күн стейттері
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // Июль 2026
  const [selectedDateStr, setSelectedDateStr] = useState("2026-07-25");

  // 2. Демо немесе серверден келген тапсырмалар базасы
  const [eventsData, setEventsData] = useState({
    "2026-07-01": { 
      status: "completed", 
      title: isRu ? "День 1: Старт & Постановка целей" : "1-күн: Старт & Мақсат қою", 
      dayNum: 1, 
      zoom: null, 
      tasks: [
        { id: 1, title: isRu ? "Просмотр видеоурока" : "Бейнесабақты қарау", time: isRu ? "15 мин" : "15 мин", done: true }, 
        { id: 2, title: isRu ? "Запись целей" : "Мақсат жазу", time: isRu ? "10 мин" : "10 мин", done: true }
      ] 
    },
    "2026-07-02": { 
      status: "completed", 
      title: isRu ? "День 2: Матрица привычек" : "2-күн: Әдеттер матрицасы", 
      dayNum: 2, 
      zoom: null, 
      tasks: [{ id: 1, title: isRu ? "Таблица Эйзенхауэра" : "Эйзенхауэр кестесі", time: isRu ? "20 мин" : "20 мин", done: true }] 
    },
    "2026-07-03": { 
      status: "completed", 
      title: isRu ? "День 3: Планирование времени" : "3-күн: Уақытты жоспарлау", 
      dayNum: 3, 
      zoom: null, 
      tasks: [{ id: 1, title: isRu ? "Создание тайм-блоков" : "Тайм-блок жасау", time: isRu ? "15 мин" : "15 мин", done: true }] 
    },
    "2026-07-04": { 
      status: "completed", 
      title: isRu ? "День 4: База информатики" : "4-күн: Информатика базасы", 
      dayNum: 4, 
      zoom: null, 
      tasks: [{ id: 1, title: isRu ? "Основы Python" : "Питон негіздері", time: isRu ? "30 мин" : "30 мин", done: true }] 
    },
    "2026-07-05": { status: "rest", title: isRu ? "Выходной день 🌿" : "Демалыс күні 🌿", dayNum: 5, zoom: null, tasks: [] },
    "2026-07-25": { 
      status: "today", 
      title: isRu ? "День 21: Математическая грамотность" : "21-күн: Математикалық сауаттылық", 
      dayNum: 21,
      zoom: { 
        title: isRu ? "Онлайн-встреча с экспертом" : "Сарапшымен онлайн кездесу", 
        time: "20:00", 
        desc: isRu ? "Разбор варианта и сессия вопросов-ответов" : "Нұсқа талдау және сұрақ-жауап сессиясы", 
        link: "https://zoom.us" 
      }, 
      tasks: [
        { id: 101, title: isRu ? "Просмотр видеоурока" : "Бейнесабақты қарау", time: isRu ? "15 минут" : "15 минут", done: true, type: "video" },
        { id: 102, title: isRu ? "Тестовое задание" : "Тест тапсырмасы", time: isRu ? "10 вопросов" : "10 сұрақ", done: false, type: "quiz" }
      ] 
    },
    "2026-07-26": { 
      status: "upcoming", 
      title: isRu ? "День 22: Интенсивный тест" : "22-күн: Интенсив тест", 
      dayNum: 22, 
      zoom: null, 
      tasks: [{ id: 201, title: isRu ? "Онлайн Contest ЕНТ" : "ҰБТ Онлайн Контест", time: isRu ? "45 мин" : "45 мин", done: false, type: "quiz" }] 
    },
    ...initialTasks
  });

  // initialTasks жаңарған жағдайда стейтке қосу
  useEffect(() => {
    if (Object.keys(initialTasks).length > 0) {
      setEventsData((prev) => ({ ...prev, ...initialTasks }));
    }
  }, [initialTasks]);

  // 3. Айды ауыстыру функциялары
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 4. Айдың күндерін есептеу
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Дүйсенбіден бастау

  // 5. Чек-лист тапсырмасының статусын ауыстыру
  const toggleTaskDone = (taskId) => {
    setEventsData((prev) => {
      const currentDay = prev[selectedDateStr];
      if (!currentDay) return prev;

      const updatedTasks = currentDay.tasks.map((t) =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );

      return {
        ...prev,
        [selectedDateStr]: {
          ...currentDay,
          tasks: updatedTasks
        }
      };
    });
  };

  const selectedDayInfo = eventsData[selectedDateStr];

  // Форматталған дата мәтіні
  const formatSelectedDateText = () => {
    const [y, m, d] = selectedDateStr.split("-").map(Number);
    return `${d} ${monthNames[m - 1]}, ${y}`;
  };

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {isRu ? "Календарь & Расписание" : "Күнтізбе & Кесте"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRu 
              ? "Задания марафона, дедлайны и расписание LIVE-уроков" 
              : "Марафон тапсырмалары, дедлайндар мен LIVE сабақтар кестесі"}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-orange-50 px-4 py-2.5 rounded-2xl border border-orange-100">
          <div className="p-2 bg-orange-500 text-white rounded-xl shadow-sm">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="text-xs text-orange-600 font-medium">
              {isRu ? "Дней подряд" : "Қатар тұрған күн"}
            </div>
            <div className="text-base font-extrabold text-orange-900">
              {streakCount} {isRu ? "Дней 🔥" : "Күн 🔥"}
            </div>
          </div>
        </div>
      </div>

      {/* 2. НЕГІЗГІ СЕТКА */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* СОЛ ЖАҚ: КАЛЕНДАРЬ */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 active:scale-95 rounded-xl transition-all border border-gray-200 cursor-pointer"
                title={isRu ? "Предыдущий месяц" : "Өткен ай"}
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 active:scale-95 rounded-xl transition-all border border-gray-200 cursor-pointer"
                title={isRu ? "Следующий месяц" : "Келесі ай"}
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Күн аттары */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {weekDays.map((day, idx) => (
              <div key={idx} className="text-xs font-bold text-gray-400 uppercase tracking-wider py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Торкөздер (Grid) */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px] bg-gray-50/30 rounded-2xl border border-transparent" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const dayNumber = i + 1;
              const formattedDay = dayNumber < 10 ? `0${dayNumber}` : dayNumber;
              const formattedMonth = month + 1 < 10 ? `0${month + 1}` : month + 1;
              const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

              const dayInfo = eventsData[dateStr];
              const isSelected = selectedDateStr === dateStr;

              return (
                <div
                  key={dayNumber}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-[70px] p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer select-none ${
                    isSelected
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200 scale-[1.02]"
                      : dayInfo?.status === "completed"
                      ? "bg-purple-50/60 border-purple-100 text-gray-800 hover:border-purple-300"
                      : dayInfo?.status === "rest"
                      ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                      : "bg-gray-50/50 border-gray-100 text-gray-700 hover:bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-700"}`}>
                      {dayNumber}
                    </span>
                    {dayInfo?.status === "completed" && !isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    {dayInfo?.zoom && (
                      <span className={`w-2 h-2 rounded-full animate-pulse ${isSelected ? "bg-amber-300" : "bg-red-500"}`} title={isRu ? "Есть LIVE-урок" : "LIVE сабақ бар"}></span>
                    )}
                  </div>

                  {dayInfo && (
                    <div className="mt-1">
                      <p className={`text-[10px] line-clamp-1 font-medium ${
                        isSelected ? "text-purple-100" : "text-gray-500"
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
              <span>{isRu ? "Выбранный день" : "Таңдалған күн"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-purple-100 border border-purple-200"></span>
              <span>{isRu ? "Выполненный день" : "Орындалған күн"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-100 border border-emerald-200"></span>
              <span>{isRu ? "Отдых" : "Демалыс"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>{isRu ? "LIVE Вебинар" : "LIVE Вебинар"}</span>
            </div>
          </div>
        </div>

        {/* ОҢ ЖАҚ: ТАҢДАЛҒАН КҮНДІҢ ТАПСЫРМАЛАРЫ */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">
                  {formatSelectedDateText()}
                </span>
                <h3 className="text-base font-bold text-gray-800 mt-0.5">
                  {selectedDayInfo?.title || (isRu ? "Заданий нет" : "Тапсырмалар жоқ")}
                </h3>
              </div>
              {selectedDayInfo?.dayNum && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full shrink-0">
                  {selectedDayInfo.dayNum}-{isRu ? "День" : "Күн"}
                </span>
              )}
            </div>

            {/* ZOOM БАННЕРІ */}
            {selectedDayInfo?.zoom && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> LIVE Вебинар
                  </span>
                  <span className="text-xs text-purple-200 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {selectedDayInfo.zoom.time}
                  </span>
                </div>
                <h4 className="font-bold text-sm">{selectedDayInfo.zoom.title}</h4>
                <p className="text-xs text-purple-100">{selectedDayInfo.zoom.desc}</p>
                <a
                  href={selectedDayInfo.zoom.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center w-full mt-2 py-2 bg-white text-purple-700 text-xs font-bold rounded-xl hover:bg-purple-50 transition-colors shadow-sm"
                >
                  {isRu ? "Подключиться к Zoom" : "Zoom-ға қосылу"}
                </a>
              </div>
            )}

            {/* КҮНДІК ЧЕК-ЛИСТ */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {isRu ? "Ежедневный чек-лист" : "Күндік чек-лист"}
              </h4>
              
              {!selectedDayInfo || !selectedDayInfo.tasks || selectedDayInfo.tasks.length === 0 ? (
                <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-medium">
                    {isRu ? "На этот день нет запланированных заданий" : "Бұл күнге белгіленген тапсырмалар жоқ"}
                  </p>
                </div>
              ) : (
                selectedDayInfo.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3 transition-all hover:bg-gray-100/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${task.type === "quiz" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                        {task.type === "quiz" ? <BookOpen className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      </div>
                      <div className="truncate">
                        <h5 className={`text-xs font-bold truncate ${task.done ? "line-through text-gray-400" : "text-gray-800"}`}>
                          {task.title}
                        </h5>
                        <p className="text-[11px] text-gray-400">{task.time}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleTaskDone(task.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                        task.done
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-purple-600 text-white hover:bg-purple-700 shadow-xs active:scale-95"
                      }`}
                    >
                      {task.done 
                        ? (isRu ? "Выполнено" : "Орындалды") 
                        : (isRu ? "Выполнить" : "Орындау")}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}