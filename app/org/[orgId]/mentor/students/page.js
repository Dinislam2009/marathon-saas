"use client";

import { use, useState, useEffect } from "react";
import { Search, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { SUBMISSION_STATUS } from "@/lib/constants";
import { getTodayDayNumber } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressGrid from "@/components/ui/ProgressGrid";
import LoadingState from "@/components/ui/LoadingState";

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
            <div className="h-12 w-12 rounded-full border-4 border-horizon flex items-center justify-center text-ink font-bold text-sm">
              {rate}%
            </div>
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
              <ProgressGrid durationDays={marathon.durationDays} submissionsByDay={submissionsByDay} todayDay={todayDay} />
            </div>
          )}

          <div className="flex justify-between text-sm border-t border-mist-light pt-4">
            <span className="text-mist">Ұпай</span>
            <span className="font-semibold text-ink">{student.points} XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MentorStudentsPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick } = useData();
  const [mentorId, setMentorId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const mentors = ready ? db.getMentorsByOrg(orgId) : [];

  useEffect(() => {
    if (ready && !mentorId && mentors[0]) setMentorId(mentors[0].id);
  }, [ready, mentors.length]);

  if (!ready) return <LoadingState />;

  const students = mentorId ? db.getStudentsByMentor(mentorId) : [];

  const filteredStudents = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  const selectedStudent = selectedStudentId ? db.getStudent(selectedStudentId) : null;
  const selectedMarathon = selectedStudent ? db.getMarathon(selectedStudent.marathonId) : null;

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Мои студенты</h1>
          <p className="text-mist text-sm mt-1">Сізге бекітілген оқушылардың тізімі және олардың үлгерімі.</p>
        </div>
        
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Аты немесе email бойынша іздеу..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-mist-light text-sm focus:outline-none focus:border-horizon bg-white"
          />
        </div>
      </div>

      <Card padded={false} className="overflow-hidden bg-white border border-mist-light rounded-2xl">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-mist-light text-xs uppercase text-mist tracking-wide font-medium bg-paper-dim/30">
              <th className="px-5 py-3">Оқушы</th>
              <th className="px-5 py-3">Ұпай</th>
              <th className="px-5 py-3">Тәртіп күйі</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mist-light bg-white">
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
                  className="cursor-pointer hover:bg-paper-dim/20 transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-ink text-base">{student.name}</p>
                    <p className="text-mist text-xs">{student.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">{student.points} XP</td>
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

      {selectedStudent && (
        <StudentDetail student={selectedStudent} marathon={selectedMarathon} onClose={() => setSelectedStudentId(null)} />
      )}
    </div>
  );
}