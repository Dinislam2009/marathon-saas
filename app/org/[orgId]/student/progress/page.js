"use client";

import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";
import { getTodayDayNumber } from "@/lib/utils";
import Card from "@/components/ui/Card";
import ProgressGrid from "@/components/ui/ProgressGrid";
import LoadingState from "@/components/ui/LoadingState";

// --- ⚡ СЕРВЕРЛІК ACTION ИМПОРТТАУ (db ИМПОРТЫ ТОЛЫҚ ТАЗАЛАНДЫ) ---
import { getStudentProgressAction } from "@/app/actions";

export default function StudentProgressPage() {
  const { ready, tick, currentStudentId } = useData();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !currentStudentId) return;

    async function loadData() {
      try {
        const res = await getStudentProgressAction(currentStudentId);
        if (res && res.ok) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Прогресті жүктеу қатесі:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [ready, currentStudentId, tick]);

  if (!ready || !currentStudentId || loading || !data) return <LoadingState />;

  const { student, marathon, allSubmissions: submissions } = data;
  if (!student || !marathon) return <LoadingState />;

  const submissionsByDay = Object.fromEntries(submissions.map((s) => [s.dayNumber, s]));
  const todayDay = getTodayDayNumber(marathon);
  const submittedCount = submissions.filter((s) => s.status === "submitted").length;
  const percent = Math.round((submittedCount / (marathon.durationDays || 1)) * 100);

  return (
    <div key={tick} className="flex flex-col gap-6 w-full">
      {/* Шапка */}
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Прогресс</h1>
        <p className="text-mist text-sm mt-1">
          Выполнено {submittedCount}/{marathon.durationDays} дней ({percent}%)
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
                <span className="h-2.5 w-2.5 rounded-full bg-steppe" /> Выполнено
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-ember/90" /> Пропущено
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-paper-dim border border-mist-light" /> Впереди
              </span>
            </div>
          </Card>
        </div>

        {/* Оң жақ: Жалпы статистика карточкасы (1 Баған) */}
        <div className="flex flex-col gap-4">
          <Card>
            <h3 className="text-xs font-extrabold text-mist uppercase tracking-wider mb-3">
              Статистика марафона
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-mist-light/50">
                <span className="text-mist">Пройдено:</span>
                <span className="font-bold text-ink">{todayDay || 1} день</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-mist-light/50">
                <span className="text-mist">Сдано отчетов:</span>
                <span className="font-bold text-steppe">{submittedCount}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-mist">Всего дней:</span>
                <span className="font-bold text-ink">{marathon.durationDays}</span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}