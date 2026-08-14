"use client";

import React, { useState, useEffect } from "react";
import { 
  Hourglass, 
  Sparkles, 
  Trophy, 
  Cake, 
  Clock, 
  Calendar, 
  Plus, 
  Bell, 
  Target 
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CountdownPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [isMounted, setIsMounted] = useState(false);

  // Оқиғалар тізімі
  const events = [
    {
      id: 1,
      title: isRu ? "Финиш марафона Shyraq" : "Shyraq Марафон финиші",
      category: isRu ? "Марафон" : "Марафон",
      targetDate: "2026-08-25T23:59:59",
      description: isRu
        ? "Завершение 21-дневного интенсивного марафона и награждение победителей."
        : "21 күндік қарқынды марафонның аяқталуы мен жеңімпаздарды марапаттау.",
      icon: Trophy,
      gradient: "from-purple-600 via-indigo-600 to-purple-800",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    },
    {
      id: 2,
      title: isRu ? "День рождения Арафата 🥳" : "Арафаттың Туған Күні 🥳",
      category: isRu ? "Личный праздник" : "Жеке мереке",
      targetDate: "2026-08-15T00:00:00",
      description: isRu
        ? "День больших целей и встречи нового возраста!"
        : "Алға қойған үлкен мақсаттар мен жаңа жасты қарсы алу күні!",
      icon: Cake,
      gradient: "from-pink-500 via-rose-500 to-red-500",
      badgeColor: "bg-pink-100 text-pink-700 border-pink-200",
    },
    {
      id: 3,
      title: isRu ? "Основной пробный тест ЕНТ" : "ҰБТ Негізгі Сынақ Тесті",
      category: isRu ? "Академический" : "Академиялық",
      targetDate: "2026-08-30T09:00:00",
      description: isRu
        ? "Важный симуляционный тест на пути к поступлению в КБТУ. Цель: 135+ баллов."
        : "КБТУ-ға түсу жолындағы маңызды симуляциялық тест. Мақсат: 135+ балл.",
      icon: Target,
      gradient: "from-amber-500 via-orange-500 to-amber-700",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    },
  ];

  const [timeLeft, setTimeLeft] = useState({});

  // Динамикалық уақытты есептеу
  useEffect(() => {
    setIsMounted(true);

    const calculateTime = () => {
      const newTimeLeft = {};
      events.forEach((event) => {
        const difference = +new Date(event.targetDate) - +new Date();
        if (difference > 0) {
          newTimeLeft[event.id] = {
            days: String(Math.floor(difference / (1000 * 60 * 60 * 24))).padStart(2, '0'),
            hours: String(Math.floor((difference / (1000 * 60 * 60)) % 24)).padStart(2, '0'),
            minutes: String(Math.floor((difference / 1000 / 60) % 60)).padStart(2, '0'),
            seconds: String(Math.floor((difference / 1000) % 60)).padStart(2, '0'),
          };
        } else {
          newTimeLeft[event.id] = { days: "00", hours: "00", minutes: "00", seconds: "00" };
        }
      });
      setTimeLeft(newTimeLeft);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 w-full pb-10 font-sans text-slate-900">
      {/* 1. БӨЛІМ ТАҚЫРЫБЫ ЖӘНЕ БАННЕР */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-2xl">
              <Hourglass className="w-6 h-6 animate-pulse" />
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isRu ? "Обратный отсчёт" : "Кері Санақ"}
            </h1>
          </div>
          <p className="text-xs text-gray-500 max-w-xl pl-1">
            {isRu
              ? "Отслеживайте точное время до важных дат, финиша марафона, пробных тестов и личных праздников."
              : "Маңызды даталарға, марафон финишіне, сынақ тесттері мен жеке мерекелерге қалған дәл уақытты бақылап, дайындықты жоспарлаңыз."}
          </p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-purple-200 shrink-0 cursor-pointer">
          <Plus className="w-4 h-4" />
          {isRu ? "Добавить событие" : "Жаңа оқиға қосу"}
        </button>
      </div>

      {/* 2. НЕГІЗГІ ТАЙМЕР КАРТОЧКАЛАРЫ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const IconComponent = event.icon;
          const time = timeLeft[event.id] || { days: "00", hours: "00", minutes: "00", seconds: "00" };

          return (
            <div
              key={event.id}
              className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all duration-300"
            >
              {/* Шапка градиенті */}
              <div className={`p-6 bg-gradient-to-r ${event.gradient} text-white relative`}>
                <div className="flex items-center justify-between">
                  <span className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                    <IconComponent className="w-5 h-5 text-white" />
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-extrabold tracking-wider uppercase text-white border border-white/20">
                    {event.category}
                  </span>
                </div>

                <h3 className="text-xl font-black mt-4 tracking-tight leading-snug">
                  {event.title}
                </h3>
                <p className="text-xs text-white/80 mt-1 line-clamp-2">
                  {event.description}
                </p>
              </div>

              {/* Кері санақ цифрлары */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="block text-2xl font-black text-gray-900">{isMounted ? time.days : "00"}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{isRu ? "Дней" : "Күн"}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="block text-2xl font-black text-gray-900">{isMounted ? time.hours : "00"}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{isRu ? "Часов" : "Сағат"}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="block text-2xl font-black text-gray-900">{isMounted ? time.minutes : "00"}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{isRu ? "Мин" : "Минут"}</span>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
                    <span className="block text-2xl font-black text-purple-700 animate-pulse">{isMounted ? time.seconds : "00"}</span>
                    <span className="text-[10px] font-bold text-purple-600 uppercase">{isRu ? "Сек" : "Секунд"}</span>
                  </div>
                </div>

                {/* Астындағы дата мен статус */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>
                      {isRu ? "Дата: " : "Күні: "}
                      {isMounted ? new Date(event.targetDate).toLocaleDateString(isRu ? "ru-RU" : "kk-KZ") : ""}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${event.badgeColor}`}>
                    {isRu ? "Активно" : "Белсенді"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. КЕСТЕЛІК ШОЛУ ЖӘНЕ ХАБАРЛАНДЫРУ КАРТОЧКАСЫ */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            {isRu ? "Расписание ВСЕХ предстоящих событий" : "Алдағы БАРЛЫҚ Оқиғалар Кестесі"}
          </h3>
          <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            {isRu ? "Всего: 3 даты" : "Жалпы: 3 дата"}
          </span>
        </div>

        <div className="space-y-3">
          {[
            { 
              name: isRu ? "Пробный тест ЕНТ (Симуляция)" : "ҰБТ Сынақ тесті (Симуляция)", 
              date: isRu ? "30 Августа 2026, 09:00" : "30 Тамыз 2026, 09:00", 
              daysLeft: isRu ? "Осталось 21 день" : "21 күн қалды", 
              status: isRu ? "Идёт подготовка" : "Дайындық жүруде" 
            },
            { 
              name: isRu ? "Финиш марафона Shyraq & Итоги" : "Shyraq Марафон Финиші & Қорытынды", 
              date: isRu ? "25 Августа 2026, 23:59" : "25 Тамыз 2026, 23:59", 
              daysLeft: isRu ? "Осталось 16 дней" : "16 күн қалды", 
              status: isRu ? "Сдача отчётов" : "Есептер тапсырылуда" 
            },
            { 
              name: isRu ? "День рождения Арафата" : "Арафаттың Туған Күні", 
              date: isRu ? "15 Августа 2026, 00:00" : "15 Тамыз 2026, 00:00", 
              daysLeft: isRu ? "Осталось 6 дней" : "6 күн қалды", 
              status: isRu ? "Ожидание" : "Күтілуде" 
            },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl shadow-xs text-purple-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{item.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
                  {item.daysLeft}
                </span>
                <span className="text-[11px] text-gray-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}