"use client";

import React, { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import { useLanguage } from "@/context/LanguageContext";
import { getTodayDayNumber } from "@/lib/utils";
import Card from "@/components/Card";
import ProgressGrid from "@/components/ProgressGrid";
import LoadingState from "@/components/LoadingState";
import * as actions from "@/app/actions";

export default function StudentProgressPage() {
  const { ready, tick, currentStudentId } = useData();
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!ready) return;

      if (!currentStudentId) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) setLoading(true);

        const getProgressFn =
          actions.getStudentProgress || actions.getStudentProgress;

        if (typeof getProgressFn === "function") {
          const res = await getProgressFn(currentStudentId);
          if (isMounted && res && res.ok) {
            setData(res.data);
          }
        }
      } catch (err) {
        console.error("Прогресті жүктеу қатесі:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ready, currentStudentId, tick]);

  if (!ready || loading) return <LoadingState />;

  if (!currentStudentId || !data || !data.student || !data.marathon) {
    return (
      <Card className="text-center py-10 font-sans">
        <p className="text-mist text-sm">
          {isRu
            ? "Не удалось загрузить данные прогресса. Попробуйте обновить страницу."
            : "Прогресс мәліметтерін жүктеу мүмкін болмады. Бетті қайта жаңартып көріңіз."}
        </p>
      </Card>
    );
  }

  const { marathon, allSubmissions } = data;
  const submissions = allSubmissions || [];
  const submissionsByDay = Object.fromEntries(
    submissions.map((s) => [s.dayNumber, s])
  );
  const todayDay = getTodayDayNumber(marathon) || 1;
  const submittedCount = submissions.filter(
    (s) => s.status === "submitted" || s.status === "SUBMITTED" || s.status === "APPROVED"
  ).length;
  const percent = Math.round(
    (submittedCount / (marathon.durationDays || 1)) * 100
  );

  return (
    <div key={tick} className="flex flex-col gap-6 w-full font-sans text-slate-900">
      {/* Шапка */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          {isRu ? "Прогресс" : "Прогресс"}
        </h1>
        <p className="text-mist text-sm mt-1">
          {isRu
            ? `Выполнено ${submittedCount}/${marathon.durationDays} дней (${percent}%)`
            : `${submittedCount}/${marathon.durationDays} күн орындалды (${percent}%)`}
        </p>
      </div>

      {/* Компьютерге арналған Grid орналасуы */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Сол жақ: Календарь / Прогресс торы (2 Баған) */}
        <div className="md:col-span-2">
          <Card>
            <ProgressGrid
              durationDays={marathon.durationDays}
              submissionsByDay={submissionsByDay}
              todayDay={todayDay}
            />
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-mist-light text-xs text-mist">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-steppe" />{" "}
                {isRu ? "Выполнено" : "Орындалды"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ember/90" />{" "}
                {isRu ? "Пропущено" : "Өткізіп алды"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-paper-dim border border-mist-light" />{" "}
                {isRu ? "Впереди" : "Алда"}
              </span>
            </div>
          </Card>
        </div>

        {/* Оң жақ: Жалпы статистика карточкасы (1 Баған) */}
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-xs font-extrabold text-mist uppercase tracking-wider mb-3">
              {isRu ? "Статистика марафона" : "Марафон статистикасы"}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-mist-light/50">
                <span className="text-mist">{isRu ? "Пройдено:" : "Өтілді:"}</span>
                <span className="font-bold text-ink">
                  {todayDay} {isRu ? "день" : "күн"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-mist-light/50">
                <span className="text-mist">
                  {isRu ? "Сдано отчетов:" : "Тапсырылған есептер:"}
                </span>
                <span className="font-bold text-steppe">{submittedCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-mist">{isRu ? "Всего дней:" : "Барлық күндер:"}</span>
                <span className="font-bold text-ink">{marathon.durationDays}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}