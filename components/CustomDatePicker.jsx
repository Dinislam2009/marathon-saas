"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, ChevronUp, ChevronDown } from "lucide-react";

export default function CustomDatePicker({ value, onChange, label, color = "purple", isRu = true }) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const calendarRef = useRef(null);
  const timeRef = useRef(null);

  const dateObj = value ? new Date(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(dateObj);

  // Уақытты бөліп алу (HH:mm)
  const initialTime = value ? value.split("T")[1]?.slice(0, 5) || "23:59" : "23:59";
  const [hours, setHours] = useState(initialTime.split(":")[0] || "23");
  const [minutes, setMinutes] = useState(initialTime.split(":")[1] || "59");

  useEffect(() => {
    if (value && value.includes("T")) {
      const timePart = value.split("T")[1]?.slice(0, 5) || "23:59";
      const [h, m] = timePart.split(":");
      setHours(h || "23");
      setMinutes(m || "59");
    }
  }, [value]);

  // Сыртты басқанда жабылу
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setIsCalendarOpen(false);
      }
      if (timeRef.current && !timeRef.current.contains(e.target)) {
        setIsTimeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Күнді таңдау
  const handleSelectDay = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const existingTime = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const dateStr = String(day).padStart(2, "0");

    onChange(`${year}-${month}-${dateStr}T${existingTime}`);
    setIsCalendarOpen(false);
  };

  // Уақытты жаңарту логикасы
  const updateExactTime = (newH, newM) => {
    let h = parseInt(newH, 10);
    let m = parseInt(newM, 10);

    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;

    if (h < 0) h = 23;
    if (h > 23) h = 0;
    if (m < 0) m = 59;
    if (m > 59) m = 0;

    const formattedH = String(h).padStart(2, "0");
    const formattedM = String(m).padStart(2, "0");

    setHours(formattedH);
    setMinutes(formattedM);

    const existingDate = value ? value.split("T")[0] : new Date().toISOString().split("T")[0];
    onChange(`${existingDate}T${formattedH}:${formattedM}`);
  };

  // Сағат пен минутты қадам бойынша арттыру/азайту
  const adjustHours = (delta) => {
    updateExactTime(parseInt(hours, 10) + delta, minutes);
  };

  const adjustMinutes = (delta) => {
    updateExactTime(hours, parseInt(minutes, 10) + delta);
  };

  // Дүйсенбіден басталатын күнтізбе торшалары
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNamesRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  const monthNamesKz = ["Қаңтар", "Ақпан", "Наурыз", "Сәуір", "Мамыр", "Маусым", "Шілде", "Тамыз", "Қыркүйек", "Қазан", "Қараша", "Желтоқсан"];
  const weekDays = isRu ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] : ["Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"];

  const timePresets = ["09:00", "12:00", "15:00", "18:00", "21:00", "23:59"];

  const formattedDate = value
    ? new Date(value).toLocaleDateString(isRu ? "ru-RU" : "kk-KZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : isRu ? "Выберите дату" : "Күнді таңдаңыз";

  const isRose = color === "rose";

  return (
    <div className="space-y-1 font-sans">
      <label className={`block text-[10px] font-black uppercase ${isRose ? "text-rose-600" : "text-purple-600"}`}>
        {label}
      </label>

      <div className="flex items-center gap-1.5">
        {/* КҮНДІ ТАҢДАУ ТҮЙМЕСІ */}
        <div className="relative flex-1" ref={calendarRef}>
          <button
            type="button"
            onClick={() => {
              setIsCalendarOpen(!isCalendarOpen);
              setIsTimeOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold transition cursor-pointer ${
              isRose
                ? "border-slate-200 hover:border-rose-400 text-slate-800"
                : "border-slate-200 hover:border-purple-400 text-slate-800"
            }`}
          >
            <span className="truncate">{formattedDate}</span>
            <CalendarIcon size={14} className={isRose ? "text-rose-500" : "text-purple-600"} />
          </button>

          {/* ПОП-АП КҮНТІЗБЕ */}
          {isCalendarOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-64 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-800">
                  {isRu ? monthNamesRu[month] : monthNamesKz[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {weekDays.map((w, idx) => (
                  <span key={idx} className="text-[10px] font-bold text-slate-400">
                    {w}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1;
                  const isSelected =
                    value &&
                    new Date(value).getDate() === d &&
                    new Date(value).getMonth() === month &&
                    new Date(value).getFullYear() === year;

                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => handleSelectDay(d)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                        isSelected
                          ? isRose
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-purple-600 text-white shadow-xs"
                          : "hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* УАҚЫТТЫ ТАҢДАУ БАТЫРМАСЫ */}
        <div className="relative" ref={timeRef}>
          <button
            type="button"
            onClick={() => {
              setIsTimeOpen(!isTimeOpen);
              setIsCalendarOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 hover:border-purple-400 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            <span>{`${hours}:${minutes}`}</span>
            <Clock size={13} className="text-slate-400" />
          </button>

          {/* ПОП-АП: УАҚЫТТЫ ЫҢҒАЙЛЫ ЕНГІЗУ */}
          {isTimeOpen && (
            <div className="absolute top-full right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 w-56 animate-in fade-in zoom-in-95 duration-150 space-y-3">
              <span className="block text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 pb-1">
                {isRu ? "Выберите время" : "Уақытты таңдаңыз"}
              </span>

              {/* Сағат пен минутты батырмалар арқылы реттеу */}
              <div className="flex items-center justify-center gap-3 py-1">
                {/* Сағат */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustHours(1)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <input
                    type="text"
                    value={hours}
                    onChange={(e) => updateExactTime(e.target.value, minutes)}
                    className="w-11 h-10 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-center text-sm font-black text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustHours(-1)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{isRu ? "Час" : "Сағат"}</span>
                </div>

                <span className="text-xl font-black text-slate-400 mb-5">:</span>

                {/* Минут */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    onClick={() => adjustMinutes(5)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <input
                    type="text"
                    value={minutes}
                    onChange={(e) => updateExactTime(hours, e.target.value)}
                    className="w-11 h-10 bg-slate-50 border border-slate-200 focus:border-purple-600 rounded-xl text-center text-sm font-black text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => adjustMinutes(-5)}
                    className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition cursor-pointer"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">{isRu ? "Мин" : "Мин"}</span>
                </div>
              </div>

              {/* Жылдам уақыт таңдау түймелері */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">
                  {isRu ? "Быстрый выбор:" : "Тез таңдау:"}
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {timePresets.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        const [h, m] = t.split(":");
                        updateExactTime(h, m);
                        setIsTimeOpen(false);
                      }}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        `${hours}:${minutes}` === t
                          ? "bg-purple-600 text-white shadow-xs"
                          : "bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}