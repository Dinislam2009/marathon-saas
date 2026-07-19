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

  return (
    <div key={tick} className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Прогресс</h1>
        <p className="text-mist text-sm mt-1">
          Выполнено {submittedCount}/{marathon.durationDays} дней
        </p>
      </div>

      <Card>
        <ProgressGrid
          durationDays={marathon.durationDays}
          submissionsByDay={submissionsByDay}
          todayDay={todayDay}
        />
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-mist-light text-xs text-mist">
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
  );
}