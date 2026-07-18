"use client";

import { use, useState, useEffect, useMemo } from "react";
import {
  Users,
  Flag,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { STUDENT_STATUS, SUBMISSION_STATUS, MARATHON_STATUS, MARATHON_STATUS_LABELS } from "@/lib/constants";
import { getTodayDayNumber, formatDate, cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressGrid from "@/components/ui/ProgressGrid";
import LoadingState from "@/components/ui/LoadingState";

// --- helpers ------------------------------------------------------------

function completionRate(student, marathon) {
  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const possible = Math.max(todayDay - 1, 0);
  if (possible === 0) return 0;
  const submissions = db.getSubmissionsByStudent(student.id);
  const submitted = submissions.filter(
    (s) => s.status === SUBMISSION_STATUS.SUBMITTED && s.dayNumber <= possible
  ).length;
  return Math.round((submitted / possible) * 100);
}

function isAtRisk(student, marathon) {
  const todayDay = getTodayDayNumber(marathon) ?? 1;
  const submissions = db.getSubmissionsByStudent(student.id);
  let missedRecent = 0;
  for (let day = todayDay - 1; day >= Math.max(1, todayDay - 3); day--) {
    const s = submissions.find((x) => x.dayNumber === day);
    if (s?.status === SUBMISSION_STATUS.MISSED) missedRecent++;
  }
  return missedRecent >= 2;
}

function last30DaysActivity(students) {
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
    db.getSubmissionsByStudent(student.id).forEach((s) => {
      if (s.status === SUBMISSION_STATUS.SUBMITTED && s.submittedAt) {
        const key = s.submittedAt.slice(0, 10);
        if (key in counts) counts[key]++;
      }
    });
  });

  return days.map((d) => ({ date: d, count: counts[d] }));
}

// --- small UI pieces ------------------------------------------------------

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-horizon/10 flex items-center justify-center text-horizon-dark shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-mist uppercase tracking-wide mb-1">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
        {sub && <p className="text-xs text-mist mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function CircularProgress({ percent, size = 72 }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-paper-dim)" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke="var(--color-steppe)"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
      <text x="50%" y="50%" transform={`rotate(90 ${size / 2} ${size / 2})`} textAnchor="middle" dominantBaseline="middle" className="fill-ink font-display font-bold text-sm">
        {percent}%
      </text>
    </svg>
  );
}

function ActivityChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-[3px] h-24">
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

function StudentDetail({ student, marathon, onClose }) {
  const submissions = db.getSubmissionsByStudent(student.id);
  const submissionsByDay = Object.fromEntries(submissions.map((s) => [s.dayNumber, s]));
  const todayDay = getTodayDayNumber(marathon);
  const rate = completionRate(student, marathon);
  const risky = isAtRisk(student, marathon);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-mist-light">
          <div>
            <h3 className="font-display font-semibold text-ink">{student.name}</h3>
            <p className="text-xs text-mist">{student.email}</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-mist hover:bg-paper-dim">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <CircularProgress percent={rate} />
            <div>
              <p className="text-xs text-mist uppercase tracking-wide mb-1">Доводимость</p>
              <Badge tone={risky ? "ember" : "steppe"}>
                {risky ? (
                  <span className="inline-flex items-center gap-1"><AlertTriangle size={11} /> Тәртіп қаупінде</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><CheckCircle2 size={11} /> Белсенді</span>
                )}
              </Badge>
            </div>
          </div>

          {marathon && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3">Орындалған тапсырмалар күнтізбесі</p>
              <ProgressGrid
                durationDays={marathon.durationDays}
                submissionsByDay={submissionsByDay}
                todayDay={todayDay}
              />
            </div>
          )}

          <div className="flex justify-between text-sm border-t border-mist-light pt-4">
            <span className="text-mist">Ұпай</span>
            <span className="font-semibold text-ink">{student.points}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- page -----------------------------------------------------------------

export default function MentorDashboardPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick } = useData();
  const [mentorId, setMentorId] = useState("");
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const mentors = ready ? db.getMentorsByOrg(orgId) : [];

  useEffect(() => {
    if (ready && !mentorId && mentors[0]) setMentorId(mentors[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mentors.length]);

  if (!ready) return <LoadingState />;

  const students = mentorId ? db.getStudentsByMentor(mentorId) : [];
  const marathons = mentorId ? db.getMarathonsForMentor(mentorId) : [];
  const activeMarathons = marathons.filter((m) => m.status === MARATHON_STATUS.ACTIVE);

  const avgCompletion = students.length
    ? Math.round(
        students.reduce((sum, s) => sum + completionRate(s, db.getMarathon(s.marathonId)), 0) / students.length
      )
    : 0;

  const activity = useMemo(() => last30DaysActivity(students), [students, tick]);

  const filteredStudents = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const selectedStudent = selectedStudentId ? db.getStudent(selectedStudentId) : null;
  const selectedMarathon = selectedStudent ? db.getMarathon(selectedStudent.marathonId) : null;

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Ментор кабинеті</h1>
          <p className="text-mist text-sm mt-1">Тек өзіңе тіркелген оқушылар (изоляция).</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-mist">
          Демо ретінде көру:
          <select
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            className="rounded-lg border border-mist-light px-2.5 py-1.5 text-xs text-ink bg-white"
          >
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex gap-1 bg-paper-dim rounded-xl p-1 w-fit">
        {[
          { key: "overview", label: "Жалпы статистика" },
          { key: "students", label: "Оқушылар статистикасы" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-horizon-dark shadow-sm" : "text-mist hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="flex flex-col gap-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <KpiCard icon={Users} label="Барлық оқушылар" value={students.length} />
            <KpiCard icon={Flag} label="Белсенді челленджтер" value={activeMarathons.length} />
            <Card className="flex items-center gap-4">
              <CircularProgress percent={avgCompletion} />
              <div>
                <p className="text-xs text-mist uppercase tracking-wide mb-1">Орташа доводимость</p>
                <p className="font-display text-xl font-semibold text-ink">{avgCompletion}%</p>
              </div>
            </Card>
          </div>

          <Card>
            <p className="text-xs font-bold uppercase tracking-wider text-mist mb-4">
              Оқушылар белсенділігі (соңғы 30 күн)
            </p>
            <ActivityChart data={activity} />
          </Card>

          <Card padded={false} className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist-light text-left text-xs uppercase text-mist tracking-wide">
                  <th className="px-5 py-3 font-medium">Челлендж атауы</th>
                  <th className="px-5 py-3 font-medium">Кезеңі</th>
                  <th className="px-5 py-3 font-medium">Қатысушы</th>
                  <th className="px-5 py-3 font-medium">Күй</th>
                </tr>
              </thead>
              <tbody>
                {marathons.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-mist">Челлендж жоқ.</td></tr>
                )}
                {marathons.map((m) => {
                  const start = new Date(m.startDate);
                  const end = new Date(m.startDate);
                  end.setDate(end.getDate() + m.durationDays - 1);
                  const count = students.filter((s) => s.marathonId === m.id).length;
                  return (
                    <tr key={m.id} className="border-b border-mist-light last:border-0">
                      <td className="px-5 py-3.5 font-medium text-ink">{m.title}</td>
                      <td className="px-5 py-3.5 text-mist text-xs">
                        {formatDate(start)} — {formatDate(end)}
                      </td>
                      <td className="px-5 py-3.5 text-ink">{count}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={m.status === MARATHON_STATUS.ACTIVE ? "steppe" : "neutral"}>
                          {MARATHON_STATUS_LABELS[m.status]}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Аты немесе email бойынша іздеу..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-mist-light text-sm"
            />
          </div>

          <Card padded={false} className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mist-light text-left text-xs uppercase text-mist tracking-wide">
                  <th className="px-5 py-3 font-medium">Оқушы</th>
                  <th className="px-5 py-3 font-medium">Ұпай</th>
                  <th className="px-5 py-3 font-medium">Тәртіп</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-10 text-center text-mist">Оқушы табылмады.</td></tr>
                )}
                {filteredStudents.map((student) => {
                  const marathon = db.getMarathon(student.marathonId);
                  const risky = marathon && isAtRisk(student, marathon);
                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className="border-b border-mist-light last:border-0 cursor-pointer hover:bg-paper-dim transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">{student.name}</p>
                        <p className="text-mist text-xs">{student.email}</p>
                      </td>
                      <td className="px-5 py-3.5 text-ink font-medium">{student.points}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={risky ? "ember" : "steppe"}>
                          {risky ? "Тәртіп қаупінде" : "Белсенді"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {selectedStudent && (
        <StudentDetail student={selectedStudent} marathon={selectedMarathon} onClose={() => setSelectedStudentId(null)} />
      )}
    </div>
  );
}
