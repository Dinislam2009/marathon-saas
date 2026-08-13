"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";
import YoutubeIcon from "@/components/YoutubeIcon";
import * as actions from "@/app/actions";
import { 
  Lock, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  Calendar, 
  Clock,
  Megaphone,
  CheckCircle2,
  UserCheck,
  BookOpen,
  Send,
  FileText,
  BellRing
} from "lucide-react";

export default function StudentDashboardPage() {
  const router = useRouter();
  const { currentStudentId, setCurrentStudentId } = useData();
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [fileUrlInput, setFileUrlInput] = useState("");

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let activeStudentId = currentStudentId;
      let activeUserId = null;

      if (!activeStudentId && typeof window !== "undefined") {
        const userObj = JSON.parse(localStorage.getItem("currentUser") || "{}");
        activeUserId = userObj?.id;
      }

      const getDashboardFn = actions.getStudentDashboardAction || actions.getStudentDashboard;
      let res = null;

      if (typeof getDashboardFn === "function") {
        res = await getDashboardFn(activeStudentId, activeUserId);
      }

      if (res?.ok && res?.data) {
        setData(res.data);
        if (res.data.student?.id) {
          setCurrentStudentId(res.data.student.id);
        }
        if (res.data.submission?.fileUrl) {
          setFileUrlInput(res.data.submission.fileUrl);
        }
      } else {
        setError(res?.error || (isRu ? "Данные марафона не найдены" : "Марафон деректері табылмады"));
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(isRu ? "Ошибка связи с сервером." : "Сервермен байланыс қатесі.");
    } finally {
      setLoading(false);
    }
  }, [currentStudentId, setCurrentStudentId, isRu]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!data?.student || !data?.task || submitting) return;

    try {
      setSubmitting(true);

      const submitFn = actions.submitTaskAction || actions.submitTask;
      let res = null;

      if (typeof submitFn === "function") {
        res = await submitFn({
          studentId: data.student.id,
          dayNumber: data.task.dayNumber,
          fileUrl: fileUrlInput.trim() || null,
        });
      }

      if (res?.ok) {
        // Оптимистік түрде интерфейсті бірден жаңарту
        setData((prev) => ({
          ...prev,
          submission: {
            ...(prev?.submission || {}),
            status: "SUBMITTED",
            fileUrl: fileUrlInput.trim() || null,
          },
        }));
        await fetchDashboardData();
      } else {
        alert(res?.error || (isRu ? "Ошибка при сохранении отчета." : "Есепті сақтау кезінде қате шықты."));
      }
    } catch (err) {
      console.error("Submit report error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isRu ? "Ошибка загрузки данных" : "Деректерді жүктеу қатесі"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">{error}</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-2xl hover:bg-purple-700 transition-all shadow-xs cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" /> {isRu ? "Перезагрузить" : "Қайта жүктеу"}
        </button>
      </div>
    );
  }

  const { student, marathon, task, submission, curator, announcements = [] } = data || {};

  if (!student || !marathon) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <BookOpen className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isRu ? "Активный марафон не найден" : "Белсенді марафон табылмады"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isRu ? "Вы еще не зарегистрированы ни на один марафон." : "Сіз әлі ешқандай марафонға тіркелмегенсіз."}
          </p>
        </div>
      </div>
    );
  }

  if (student.status === "BLOCKED") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4 font-sans">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {isRu ? "Аккаунт заблокирован" : "Аккаунт бұғатталған"}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            {isRu ? "Ваше участие в этом марафоне временно ограничено." : "Сіздің бұл марафонға қатысу мүмкіндігіңіз уақытша шектелген."}
          </p>
        </div>
      </div>
    );
  }

  const dayNumber = task?.dayNumber || 1;
  const totalDays = marathon.durationDays || 21;
  const isSubmitted = submission && (submission.status === "SUBMITTED" || submission.status === "submitted" || submission.status === "APPROVED");

  const displayTaskTitle = isRu ? (task?.titleRu || task?.title) : (task?.titleKz || task?.title);
  const displayTaskContent = isRu ? (task?.contentRu || task?.content) : (task?.contentKz || task?.content);

  return (
    <div className="w-full pb-8 space-y-6 font-sans text-slate-900">
      
      {/* 1. БАННЕР */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-700 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
            <Calendar className="w-3.5 h-3.5" />
            {isRu ? `День ${dayNumber} / ${totalDays}` : `Күн ${dayNumber} / ${totalDays}`}
          </span>

          <span className="text-xs font-bold bg-purple-900/40 px-3 py-1 rounded-full border border-purple-400/30">
            {isRu ? "Баллы: " : "Ұпай: "}{student.points || 0} XP
          </span>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {marathon.title}
          </h1>
          {marathon.description && (
            <p className="text-purple-100 text-xs md:text-sm font-medium mt-1 max-w-2xl">
              {marathon.description}
            </p>
          )}
        </div>
      </div>

      {/* 2. НЕГІЗГІ СЕТКА */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* СОЛ ЖАҚ ПАНЕЛЬ */}
        <div className="lg:col-span-2 space-y-6">

          {/* КҮННІҢ ТАПСЫРМАСЫ */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            {task ? (
              <>
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                      {isRu ? `Урок ${task.dayNumber}-го дня` : `${task.dayNumber}-күннің сабағы`}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{displayTaskTitle}</h2>
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full border border-purple-100">
                    {task.verificationType === "SCREENSHOT" ? (isRu ? "Скриншот" : "Скриншот") : (isRu ? "Тест" : "Тест")}
                  </span>
                </div>

                {/* Тапсырма мазмұны */}
                {displayTaskContent && (
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                    {displayTaskContent}
                  </p>
                )}

                {/* Бейнесабақ */}
                {task.videoUrl && (
                  <a
                    href={task.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 text-xs font-bold transition-all group w-full justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <YoutubeIcon className="w-5 h-5 text-red-600 group-hover:scale-110 transition-transform" />
                      <span>{isRu ? "Смотреть видеоурок" : "Бейнесабақты қарау"}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-400" />
                  </a>
                )}

                {/* Файлдар */}
                {task.fileUrls && task.fileUrls.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {isRu ? "Дополнительные файлы к уроку:" : "Сабаққа қосымша файлдар:"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {task.fileUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                        >
                          <FileText size={14} className="text-purple-600" />
                          <span>{isRu ? `Файл ${i + 1}` : `Файл ${i + 1}`}</span>
                          <ExternalLink size={12} className="text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-700">
                  {isRu ? "Сегодняшний урок еще не опубликован в базе" : "Бүгінгі сабақ базада әлі жарияланған жоқ"}
                </h3>
              </div>
            )}
          </div>

          {/* ЕСЕП ТАПСЫРУ */}
          {task && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800">
                  {isRu ? "Сдать сегодняшний отчет" : "Бүгінгі есепті тапсыру"}
                </h3>
                {isSubmitted && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 size={14} /> {isRu ? "Сдано" : "Тапсырылды"}
                  </span>
                )}
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                    {isRu ? "Ссылка на выполненное задание или скриншот (URL)" : "Орындалған тапсырманың немесе скриншоттың сілтемесі (URL)"}
                  </label>
                  <input
                    type="url"
                    disabled={isSubmitted || submitting}
                    value={fileUrlInput}
                    onChange={(e) => setFileUrlInput(e.target.value)}
                    placeholder={isRu ? "https://drive.google.com/... или ссылка на изображение" : "https://drive.google.com/... немесе сурет сілтемесі"}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-slate-50 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                {!isSubmitted ? (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-purple-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send size={15} />
                    {submitting ? (isRu ? "Отправка..." : "Жіберілуде...") : (isRu ? "Сдать отчет" : "Есепті тапсыру")}
                  </button>
                ) : (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs font-bold text-purple-700 text-center">
                    {isRu ? "✓ Отчет успешно принят" : "✓ Есеп сәтті қабылданды"}
                  </div>
                )}
              </form>
            </div>
          )}

        </div>

        {/* ОҢ ЖАҚ ПАНЕЛЬ */}
        <div className="space-y-6">

          {/* 1. КҮНТІЗБЕ */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                {isRu ? "Срок марафона" : "Марафон мерзімі"}
              </h3>
              <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                {totalDays} {isRu ? "дней" : "күн"}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {Array.from({ length: Math.min(totalDays, 21) }).map((_, i) => {
                const dayVal = i + 1;
                const isCurrent = dayVal === dayNumber;
                const isPast = dayVal < dayNumber;

                return (
                  <div
                    key={`day-${dayVal}`}
                    className={`py-2 rounded-xl text-xs flex flex-col items-center justify-center transition-all ${
                      isPast
                        ? "bg-purple-100 text-purple-700 font-bold"
                        : isCurrent
                        ? "bg-purple-600 text-white font-extrabold shadow-xs scale-105"
                        : "bg-slate-50 text-slate-400 font-medium"
                    }`}
                  >
                    <span className="text-[9px] uppercase">{isRu ? "День" : "Күн"}</span>
                    <span className="text-xs">{dayVal}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. 📢 ХАБАРЛАНДЫРУЛАР КАРТОЧКАСЫ (ОҢ ЖАҚТА) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Megaphone size={16} className="text-purple-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  {isRu ? "Объявления" : "Хабарландырулар"}
                </h3>
              </div>
              {announcements.length > 0 && (
                <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {announcements.length} {isRu ? "новых" : "жаңа"}
                </span>
              )}
            </div>

            {announcements.length === 0 ? (
              <div className="py-4 text-center space-y-1">
                <BellRing size={20} className="text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">
                  {isRu ? "Нет новых объявлений" : "Жаңа хабарландыру жоқ"}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scroll-smooth">
                {announcements.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-purple-50/50 hover:bg-purple-50 border border-purple-100/60 rounded-2xl space-y-1 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] font-extrabold text-purple-600">
                      <span>{item.authorName || (isRu ? "Администрация" : "Әкімшілік")}</span>
                      <span className="text-slate-400 font-semibold">
                        {new Date(item.createdAt).toLocaleDateString(isRu ? "ru-RU" : "kk-KZ")}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 font-normal leading-relaxed line-clamp-3 whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. КУРАТОР */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              {isRu ? "Куратор марафона" : "Марафон Кураторы"}
            </h3>
            
            {curator ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-sm shrink-0 border border-purple-200">
                  {curator.name ? curator.name.charAt(0) : <UserCheck size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {curator.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {curator.phone || curator.email || (isRu ? "Куратор группы" : "Топ кураторы")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-400 text-center font-medium">
                {isRu ? "Куратор еще не назначен" : "Куратор әлі бекітілмеген"}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}