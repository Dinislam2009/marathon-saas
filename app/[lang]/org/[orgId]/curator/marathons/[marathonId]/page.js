"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CircleCheck, Circle, ChevronDown, Paperclip, Loader2, Megaphone } from "lucide-react";
import * as actions from "@/app/actions";
import { VERIFICATION_TYPE_LABELS } from "@/lib/constants";
import CreateAnnouncementModal from "@/components/CreateAnnouncementModal";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function CuratorMarathonDetailPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const marathonId = resolvedParams?.marathonId;

  const [marathon, setMarathon] = useState(null);
  const [dbTasks, setDbTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState(null);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!marathonId) return;
      setLoading(true);
      try {
        if (typeof actions.getcuratorMarathons === "function") {
          const marathons = await actions.getcuratorMarathons();
          const found = marathons?.find((m) => String(m.id) === String(marathonId));
          setMarathon(found || null);
        }

        if (typeof actions.getTasksByMarathon === "function") {
          const tasksData = await actions.getTasksByMarathon(marathonId);
          if (Array.isArray(tasksData)) {
            setDbTasks(tasksData);
          }
        }
      } catch (err) {
        console.error("Load curator marathon details error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [marathonId]);

  if (loading) {
    return <LoadingState />;
  }

  if (!marathon) {
    return (
      <p className="p-6 text-slate-500 text-xs font-bold font-sans">
        {isRu ? "Марафон не найден." : "Марафон табылмады."}
      </p>
    );
  }

  const taskByDay = Object.fromEntries(dbTasks.map((t) => [t.dayNumber, t]));
  const days = Array.from({ length: marathon.durationDays || 21 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 font-sans text-slate-900 pb-12">
      <div>
        <Link
          href={`/${lang}/org/curator/marathons`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-700 transition-colors mb-3"
        >
          <ArrowLeft size={14} /> {isRu ? "Назад к марафонам" : "Марафондарға қайту"}
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{marathon.title}</h1>
            <p className="text-slate-500 text-xs mt-1">
              {isRu
                ? `Всего ${marathon.durationDays || 21} дней • готово заданий: ${dbTasks.length}`
                : `Барлығы ${marathon.durationDays || 21} күн • ${dbTasks.length} тапсырма дайын`}
            </p>
          </div>

          {/* 📢 ХАБАРЛАНДЫРУ ЖІБЕРУ БАТЫРМАСЫ */}
          <button
            onClick={() => setIsAnnouncementOpen(true)}
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer shadow-xs"
          >
            <Megaphone size={16} />
            {isRu ? "Отправить объявление" : "Хабарландыру жіберу"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {days.map((day) => {
          const task = taskByDay[day];
          const isOpen = openDay === day;

          return (
            <div key={day} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenDay(isOpen ? null : day)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {task ? (
                  <CircleCheck size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <Circle size={18} className="text-slate-300 shrink-0" />
                )}
                <span className="text-xs font-black text-slate-400 w-14 shrink-0">
                  {day}-{isRu ? "день" : "күн"}
                </span>
                <span className={`flex-1 text-xs font-bold truncate ${task ? "text-slate-900" : "text-slate-400 italic"}`}>
                  {task ? task.title : (isRu ? "Задание не добавлено" : "Тапсырма қосылмаған")}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isOpen && task && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4 bg-slate-50/50">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-1">
                      {isRu ? "Название задания" : "Тапсырма атауы"}
                    </p>
                    <p className="text-xs font-extrabold text-slate-800">{task.title}</p>
                  </div>

                  {task.videoUrl && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-1">
                        {isRu ? "Видеоурок" : "Видео сабақ"}
                      </p>
                      <a
                        href={task.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-purple-600 hover:underline truncate block"
                      >
                        {task.videoUrl}
                      </a>
                    </div>
                  )}

                  {task.content && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-1">
                        {isRu ? "Инструкция & Описание" : "Нұсқаулық & Түсініктеме"}
                      </p>
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">{task.content}</p>
                    </div>
                  )}

                  {task.verificationType && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-1">
                        {isRu ? "Формат проверки" : "Тексеру форматы"}
                      </p>
                      <span className="inline-block bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        {VERIFICATION_TYPE_LABELS?.[task.verificationType] || task.verificationType}
                      </span>
                    </div>
                  )}

                  {(task.fileUrls?.length > 0 || task.fileUrl) && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 mb-2">
                        {isRu ? "Прикреплённые файлы" : "Тіркелген файлдар"}
                      </p>
                      <div className="flex flex-col gap-2">
                        {(task.fileUrls || [task.fileUrl]).map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-xs font-bold text-purple-600 hover:underline bg-white p-2.5 border border-slate-200 rounded-xl w-fit"
                          >
                            <Paperclip size={14} />
                            <span>{isRu ? `Открыть файл #${idx + 1}` : `Файл #${idx + 1} ашу`}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isOpen && !task && (
                <div className="px-5 py-4 border-t border-slate-100 text-xs text-slate-400 italic">
                  {isRu
                    ? "Организатор ещё не добавил задание на этот день."
                    : "Бұл күнге ұйымдастырушы әлі тапсырма қоспаған."}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 📢 ХАБАРЛАНДЫРУ МОДАЛЬДІ ТЕРЕЗЕСІ */}
      <CreateAnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        marathonId={marathonId}
        authorRole="curator"
        authorName={isRu ? "Куратор" : "Куратор"}
      />
    </div>
  );
}