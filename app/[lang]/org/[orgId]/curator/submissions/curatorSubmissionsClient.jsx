"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, XCircle, Clock, FileText, 
  ExternalLink, Search, User, Trophy, Loader2, Image as ImageIcon 
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function CuratorSubmissionsClient({ initialSubmissions = [] }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [filter, setFilter] = useState("PENDING"); // PENDING | APPROVED | REJECTED | ALL
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  // 🔍 Фильтрация және іздеу
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesFilter = filter === "ALL" ? true : sub.status === filter;
    const q = searchTerm.trim().toLowerCase();
    const studentName = (sub.student?.name || "").toLowerCase();
    const taskTitle = (sub.task?.title || "").toLowerCase();
    const matchesSearch = !q || studentName.includes(q) || taskTitle.includes(q);

    return matchesFilter && matchesSearch;
  });

  // ⚡ Тексеру функциясы
  const handleReview = async (submissionId, status, studentId, points) => {
    if (loadingId) return;
    setLoadingId(submissionId);

    try {
      const reviewFn = actions.reviewSubmission;
      
      if (typeof reviewFn === "function") {
        const res = await reviewFn({
          submissionId,
          status,
          studentId,
          points: Number(points) || 0,
        });

        if (res?.ok) {
          setSubmissions((prev) =>
            prev.map((s) => (s.id === submissionId ? { ...s, status } : s))
          );
        } else {
          alert((isRu ? "Ошибка: " : "Қате: ") + (res?.error || (isRu ? "Не удалось обновить" : "Жаңарту мүмкін болмады")));
        }
      } else {
        alert(isRu ? "Функция проверки не найдена" : "Тексеру функциясы табылмады");
      }
    } catch (err) {
      console.error("Review error:", err);
      alert(isRu ? "Произошла серверная ошибка" : "Серверлік қате орын алды");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 w-full pb-8 font-sans text-slate-900">
      {/* БАННЕР */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100">
            {isRu ? "Панель куратора" : "Куратор Панелі"}
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mt-2">
            {isRu ? "Отчёты учеников" : "Оқушылардың Есептері"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isRu
              ? "Проверяйте задания, начисляйте XP баллы или отклоняйте отчёты."
              : "Тапсырмаларды тексеріп, XP балл беріңіз немесе қайтарыңыз."}
          </p>
        </div>

        {/* Фильтрлер */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "PENDING", label: isRu ? "На проверке" : "Тексерілуде" },
            { id: "APPROVED", label: isRu ? "Принятые" : "Қабылданған" },
            { id: "REJECTED", label: isRu ? "Отклонённые" : "Қайтарылған" },
            { id: "ALL", label: isRu ? "Все" : "Барлығы" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ІЗДЕУ ЖОЛАҒЫ */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder={isRu ? "Поиск по имени ученика или названию задания..." : "Оқушы аты немесе тапсырма тақырыбы бойынша іздеу..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-medium outline-none focus:border-purple-600 shadow-sm"
        />
      </div>

      {/* ЕСЕПТЕР ТІЗІМІ */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-2">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="text-base font-bold text-gray-800">
            {isRu ? "Отчёты не найдены" : "Есептер табылмады"}
          </h3>
          <p className="text-xs text-gray-400">
            {isRu ? "В этой категории пока нет работ." : "Бұл санатта әлі ешқандай жұмыс жоқ."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSubmissions.map((sub) => {
            const isLoading = loadingId === sub.id;
            const isBase64 = sub.fileUrl?.startsWith("data:");

            return (
              <div
                key={sub.id}
                className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Оқушы мен Тапсырма аты */}
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                        <User className="w-3.5 h-3.5" />
                        <span>{sub.student?.name || (isRu ? "Неизвестный ученик" : "Белгісіз оқушы")}</span>
                      </div>
                      <h3 className="text-sm font-extrabold text-gray-900 mt-1">
                        {sub.task?.title || (isRu ? `Задание ${sub.dayNumber}-го дня` : `${sub.dayNumber}-Күн Тапсырмасы`)}
                      </h3>
                    </div>

                    <span className="text-[10px] font-black px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg shrink-0">
                      {sub.dayNumber}-{isRu ? "День" : "Күн"}
                    </span>
                  </div>

                  {/* Жіберілген Файл / Сурет / Чекбокс */}
                  {sub.fileUrl ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          {isBase64 ? (
                            <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-gray-700 truncate">
                            {isRu ? "Загруженный файл / фото" : "Жүктелген файл / сурет"}
                          </span>
                        </div>
                        <a
                          href={sub.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={isBase64 ? `submission_${sub.id}` : undefined}
                          className="p-1.5 bg-white border border-gray-200 rounded-xl text-purple-600 hover:bg-purple-50 transition-all shrink-0 flex items-center gap-1 text-[11px] font-bold"
                        >
                          <span>{isRu ? "Открыть" : "Ашу"}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Егер Base64 сурет болса - кішкентай превью көрсету */}
                      {isBase64 && sub.fileUrl.startsWith("data:image") && (
                        <div className="h-32 w-full rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
                          <img
                            src={sub.fileUrl}
                            alt="Student work"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-medium text-gray-500">
                      ☑️ {isRu ? "Сдано через чек-лист" : "Белгілеу (Чек-лист) арқылы өткізілген"}
                    </div>
                  )}
                </div>

                {/* Статус және Басқару */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] font-bold">
                    {sub.status === "PENDING" && (
                      <span className="text-amber-600 flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> {isRu ? "На проверке" : "Тексерілуде"}
                      </span>
                    )}
                    {sub.status === "APPROVED" && (
                      <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? "Принято" : "Қабылданды"}
                      </span>
                    )}
                    {sub.status === "REJECTED" && (
                      <span className="text-red-600 flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg">
                        <XCircle className="w-3.5 h-3.5" /> {isRu ? "Отклонено" : "Қайтарылды"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={isLoading || sub.status === "REJECTED"}
                      onClick={() =>
                        handleReview(sub.id, "REJECTED", sub.studentId, 0)
                      }
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isRu ? "Отклонить" : "Қайтару"}
                    </button>

                    <button
                      disabled={isLoading || sub.status === "APPROVED"}
                      onClick={() =>
                        handleReview(
                          sub.id,
                          "APPROVED",
                          sub.studentId,
                          sub.task?.points || 10
                        )
                      }
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? "Принять" : "Қабылдау"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}