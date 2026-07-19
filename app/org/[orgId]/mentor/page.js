"use client";

import { use, useState, useEffect, useMemo } from "react";
import { Users, Flag } from "lucide-react";
import { useData } from "@/context/DataContext";
import { SUBMISSION_STATUS, MARATHON_STATUS, MARATHON_STATUS_LABELS } from "@/lib/constants";
import { getTodayDayNumber, formatDate } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";

// Клиенттік деңгейде доводимость есептеу функциясы (state арқылы)
function completionRate(student, marathon, allSubmissions = {}) {
  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const possible = Math.max(todayDay - 1, 0);
  if (possible === 0) return 0;
  
  const studentSubmissions = Object.values(allSubmissions).filter(
    (s) => s.studentId === student.id
  );
  
  const submitted = studentSubmissions.filter(
    (s) => s.status === SUBMISSION_STATUS.SUBMITTED && s.dayNumber <= possible
  ).length;
  
  return Math.round((submitted / possible) * 100);
}

// 30 күндік белсенділікті state арқылы есептеу
function last30DaysActivity(students, allSubmissions = {}) {
  const counts = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  days.forEach((d) => (counts[d] = 0));

  students.forEach((student) => {
    const studentSubmissions = Object.values(allSubmissions).filter(
      (s) => s.studentId === student.id
    );
    studentSubmissions.forEach((s) => {
      if (s.status === SUBMISSION_STATUS.SUBMITTED && s.submittedAt) {
        const key = s.submittedAt.slice(0, 10);
        if (key in counts) counts[key]++;
      }
    });
  });
  return days.map((d) => ({ date: d, count: counts[d] }));
}

function KpiCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-start gap-3 bg-white border border-mist-light rounded-2xl">
      <div className="h-10 w-10 rounded-xl bg-horizon/10 flex items-center justify-center text-horizon-dark shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-mist uppercase tracking-wide mb-1 font-medium">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
}

function ActivityChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-[4px] h-24 pt-4">
      {data.map((d) => (
        <div
          key={d.date}
          title={`${d.date}: ${d.count}`}
          className="flex-1 bg-horizon/70 hover:bg-horizon rounded-t transition-all"
          style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 8 : 2)}%` }}
        />
      ))}
    </div>
  );
}

export default function MentorDashboardPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick, state } = useData();
  const [mentorId, setMentorId] = useState("");

  // Тікелей db шақыруларын DataContext мемлекетіне ауыстыру
  const mentors = useMemo(() => {
    if (!ready || !state?.mentors) return [];
    return Object.values(state.mentors).filter((m) => m.orgId === orgId);
  }, [ready, state?.mentors, orgId]);

  useEffect(() => {
    if (ready && !mentorId && mentors[0]) setMentorId(mentors[0].id);
  }, [ready, mentors, mentorId]);

  const students = useMemo(() => {
    if (!mentorId || !state?.students) return [];
    return Object.values(state.students).filter((s) => s.mentorId === mentorId);
  }, [mentorId, state?.students]);

  const marathons = useMemo(() => {
    if (!ready || !state?.marathons) return [];
    // Ұйымға байланысты барлық марафонды алу
    return Object.values(state.marathons).filter((m) => m.orgId === orgId);
  }, [ready, state?.marathons, orgId]);

  if (!ready) return <LoadingState />;

  const activeMarathons = marathons.filter((m) => m.status === MARATHON_STATUS.ACTIVE);

  const avgCompletion = students.length
    ? Math.round(
        students.reduce((sum, s) => {
          const marathon = state?.marathons?.[s.marathonId] || {};
          return sum + completionRate(s, marathon, state?.submissions || {});
        }, 0) / students.length
      )
    : 0;

  const activity = last30DaysActivity(students, state?.submissions || {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Статистика куратора</h1>
          <p className="text-mist text-sm mt-1">Бекітілген оқушылар мен марафондар бойынша аналитика.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-mist">
          Демо куратор:
          <select
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            className="rounded-lg border border-mist-light px-2.5 py-1.5 text-xs text-ink bg-white focus:outline-none"
          >
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Барлық оқушылар" value={students.length} />
        <KpiCard icon={Flag} label="Белсенді марафондар" value={activeMarathons.length} />
        <Card className="flex items-center gap-4 bg-white border border-mist-light rounded-2xl">
          <div className="h-12 w-12 rounded-full border-4 border-horizon flex items-center justify-center text-ink font-bold text-sm">
            {avgCompletion}%
          </div>
          <div>
            <p className="text-xs text-mist uppercase tracking-wide font-medium">Орташа доводимость</p>
          </div>
        </Card>
      </div>

      <Card className="bg-white border border-mist-light rounded-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-mist">
          Оқушылар белсенділігі (соңғы 30 күн)
        </p>
        <ActivityChart data={activity} />
      </Card>

      <Card padded={false} className="overflow-hidden bg-white border border-mist-light rounded-2xl">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-mist-light text-xs uppercase text-mist tracking-wide font-medium bg-paper-dim/30">
              <th className="px-5 py-3">Марафон атауы</th>
              <th className="px-5 py-3">Мерзімі</th>
              <th className="px-5 py-3">Қатысушылар</th>
              <th className="px-5 py-3">Күйі</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-light">
            {marathons.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-mist">Марафондар жоқ.</td></tr>
            )}
            {marathons.map((m) => {
              const start = new Date(m.startDate);
              const end = new Date(m.startDate);
              end.setDate(end.getDate() + (m.durationDays || 21) - 1);
              const count = students.filter((s) => s.marathonId === m.id).length;
              return (
                <tr key={m.id} className="hover:bg-paper-dim/10">
                  <td className="px-5 py-3.5 font-medium text-ink">{m.title}</td>
                  <td className="px-5 py-3.5 text-mist text-xs">
                    {formatDate(start)} — {formatDate(end)}
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">{count}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={m.status === MARATHON_STATUS.ACTIVE ? "steppe" : "neutral"}>
                      {MARATHON_STATUS_LABELS[m.status] || "Черновик"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}