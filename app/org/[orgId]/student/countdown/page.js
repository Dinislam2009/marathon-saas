"use client";

import { useEffect, useState } from "react";
import { Hourglass } from "lucide-react";
import * as actions from "@/app/actions";
import { useData } from "@/context/DataContext";
import { getDayDate, getDeadline, getTodayDayNumber } from "@/lib/utils";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function diffParts(target, now) {
  const ms = Math.max(0, target - now);
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

export default function CountdownPage() {
  const { ready, currentStudentId } = useData();
  const now = useNow();
  if (!ready || !currentStudentId) return <LoadingState />;

  const marathon = db.getMarathonForStudent(currentStudentId);
  if (!marathon) return <LoadingState />;

  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const todayDeadline = getDeadline(marathon, todayDay);
  const marathonEnd = getDayDate(marathon, marathon.durationDays);
  marathonEnd.setHours(23, 0, 0, 0);

  const toDeadline = diffParts(todayDeadline, now);
  const toEnd = diffParts(marathonEnd, now);

  return (
    <div key={now.getSeconds()} className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Hourglass size={20} className="text-horizon-dark" />
        <h1 className="font-display text-2xl font-semibold text-ink">Кері санақ</h1>
      </div>

      <Card className="bg-gradient-to-br from-horizon to-horizon-dark text-white border-none text-center py-8">
        <p className="text-xs uppercase tracking-wide text-white/70 mb-3">Бүгінгі дедлайнға дейін</p>
        <div className="flex justify-center gap-3">
          {[
            [toDeadline.h, "сағ"],
            [toDeadline.m, "мин"],
            [toDeadline.s, "сек"],
          ].map(([val, label]) => (
            <div key={label} className="bg-white/15 rounded-2xl px-4 py-3 min-w-[70px]">
              <p className="font-display text-2xl font-bold">{String(val).padStart(2, "0")}</p>
              <p className="text-[10px] uppercase text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="text-center py-8">
        <p className="text-xs uppercase tracking-wide text-mist mb-3">Марафон аяқталуына дейін</p>
        <div className="flex justify-center gap-3">
          {[
            [toEnd.d, "күн"],
            [toEnd.h, "сағ"],
            [toEnd.m, "мин"],
          ].map(([val, label]) => (
            <div key={label} className="bg-paper-dim rounded-2xl px-4 py-3 min-w-[70px]">
              <p className="font-display text-2xl font-bold text-ink">{String(val).padStart(2, "0")}</p>
              <p className="text-[10px] uppercase text-mist">{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
