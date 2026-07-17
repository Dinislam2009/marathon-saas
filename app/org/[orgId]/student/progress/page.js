"use client";

import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { getTodayDayNumber } from "@/lib/utils";
import Card from "@/components/ui/Card";
import LivesBadge from "@/components/ui/LivesBadge";
import ProgressGrid from "@/components/ui/ProgressGrid";
import LoadingState from "@/components/ui/LoadingState";

export default function StudentProgressPage() {
  const { ready, tick, currentStudentId } = useData();

  if (!ready || !currentStudentId) return <LoadingState />;

  const student = db.getStudent(currentStudentId);
  const marathon = db.getMarathonForStudent(currentStudentId);
  if (!student || !marathon) return <LoadingState />;

  const submissions = db.getSubmissionsByStudent(student.id);
  const submissionsByDay = Object.fromEntries(submissions.map((s) => [s.dayNumber, s]));
  const todayDay = getTodayDayNumber(marathon);
  const submittedCount = submissions.filter((s) => s.status === "submitted").length;

  return (
    <div key={tick} className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Прогресс</h1>
          <p className="text-mist text-sm mt-1">
            {submittedCount}/{marathon.durationDays} күн орындалды
          </p>
        </div>
        <LivesBadge lives={student.lives} size={22} />
      </div>

      <Card>
        <ProgressGrid
          durationDays={marathon.durationDays}
          submissionsByDay={submissionsByDay}
          todayDay={todayDay}
        />
        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-mist-light text-xs text-mist">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-steppe" /> Орындалды
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ember/90" /> Өткізіп алды
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-paper-dim border border-mist-light" /> Алда
          </span>
        </div>
      </Card>
    </div>
  );
}
