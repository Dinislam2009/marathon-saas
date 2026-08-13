"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CuratorStatisticsClient({
  marathonTitle = "Марафон",
  tasks = [],
  submissions = [],
  totalStudentsCount = 0,
}) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [selectedDayNumber, setSelectedDayNumber] = useState(1);

  // Таңдалған күннің Task мағлұматы мен Submission тізімі
  const activeTask = tasks.find((t) => Number(t.dayNumber) === Number(selectedDayNumber));
  const daySubmissions = submissions.filter((s) => Number(s.dayNumber) === Number(selectedDayNumber));

  // Метрикаларды есептеу
  const submittedCount = daySubmissions.length;
  const pendingCount = daySubmissions.filter((s) => s.status === "PENDING").length;
  const completionRate = totalStudentsCount > 0 
    ? Math.round((submittedCount / totalStudentsCount) * 100) 
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans text-slate-900 pb-12">
      
      {/* 1. Тақырып */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {marathonTitle} • {isRu ? "Статистика 1-й недели" : "1-Апта Статистикасы"}
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          {isRu
            ? "Выберите день, чтобы проверить ежедневное выполнение заданий учениками"
            : "Күндерді таңдап, оқушылардың күнделікті тапсырма орындалуын тексеріңіз"}
        </p>
      </div>

      {/* 2. 7 КҮНДІК ТАБ ТҮЙМЕЛЕРІ */}
      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
          const isActive = selectedDayNumber === dayNum;
          const hasTask = tasks.some((t) => Number(t.dayNumber) === dayNum);
          
          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => setSelectedDayNumber(dayNum)}
              className={`py-3 px-2 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                isActive
                  ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200"
                  : "bg-white border-slate-200 text-slate-800 hover:border-purple-300"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-purple-200" : "text-slate-400"}`}>
                {isRu ? "ДЕНЬ" : "КҮН"}
              </span>
              <span className="text-lg font-black">{dayNum}</span>
              {hasTask && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Күндік Карточка Сводкасы */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {selectedDayNumber}-{isRu ? "ДЕНЬ: " : "КҮН: "}{activeTask?.title || (isRu ? "Задание не добавлено" : "Тапсырма енгізілмеген")}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {isRu ? "Тип проверки: " : "Тексеру түрі: "}<span className="font-semibold text-purple-700">{activeTask?.verificationType || "TEST"}</span>
            </p>
          </div>
          <span className="bg-purple-50 text-purple-700 font-bold text-xs px-3 py-1.5 rounded-xl border border-purple-100">
            {selectedDayNumber}-{isRu ? "день выбран" : "күн таңдалды"}
          </span>
        </div>

        {/* Метрикалар санмен */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <p className="text-slate-400 text-xs font-bold">{isRu ? "Сдавшие ученики" : "Тапсырған оқушылар"}</p>
            <p className="text-slate-900 font-black text-lg mt-0.5">
              {submittedCount} / {totalStudentsCount}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold">{isRu ? "Ожидают проверки" : "Тексеруді күтуде"}</p>
            <p className="text-purple-600 font-black text-lg mt-0.5">
              {pendingCount} {isRu ? "отчётов" : "есеп"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold">{isRu ? "Процент охвата" : "Қамту пайызы"}</p>
            <p className="text-emerald-600 font-black text-lg mt-0.5">
              {completionRate}%
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-xs font-bold">{isRu ? "Опоздали/Не сдали" : "Кешіккендер/Тапсырмаған"}</p>
            <p className="text-amber-600 font-black text-lg mt-0.5">
              {Math.max(0, totalStudentsCount - submittedCount)} {isRu ? "учеников" : "оқушы"}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Осы Күннің Есептері Тізімі */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">
          {isRu ? "Список выполнения учеников" : "Оқушылардың орындау тізімі"}
        </h3>

        <div className="divide-y divide-slate-100">
          {daySubmissions.length > 0 ? (
            daySubmissions.map((sub) => (
              <div key={sub.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    {sub.student?.name?.[0] || (isRu ? "У" : "О")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{sub.student?.name || (isRu ? "Ученик" : "Оқушы")}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {sub.submittedAt 
                        ? (isRu ? `Время: ${new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : `Уақыты: ${new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
                        : (isRu ? "Время неизвестно" : "Уақыты белгісіз")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                    sub.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}>
                    {sub.status === "PENDING" 
                      ? (isRu ? "На проверке" : "Тексеруде") 
                      : (isRu ? "Принято" : "Қабылданды")}
                  </span>

                  {sub.fileUrl && (
                    <a
                      href={sub.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-slate-400 hover:text-purple-600 transition cursor-pointer"
                      title={isRu ? "Просмотреть файл" : "Файлды көру"}
                    >
                      <Eye size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center font-medium">
              {isRu ? "Ни один ученик ещё не сдал отчёт за этот день." : "Бұл күнге әлі ешқандай оқушы есеп тапсырмаған."}
            </p>
          )}
        </div>
      </div>

    </div>
  );
}