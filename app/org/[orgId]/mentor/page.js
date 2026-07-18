"use client";

import { use, useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { STUDENT_STATUS, DEFAULT_LIVES } from "@/lib/constants";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";

export default function MentorDashboardPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick, setStudentLives } = useData();
  const [mentorId, setMentorId] = useState("");

  const mentors = ready ? db.getMentorsByOrg(orgId) : [];

  useEffect(() => {
    if (ready && !mentorId && mentors[0]) setMentorId(mentors[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mentors.length]);

  if (!ready) return <LoadingState />;

  const students = mentorId
    ? db.getStudentsByMentor(mentorId).slice().sort((a, b) => b.points - a.points)
    : [];

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Менің оқушыларым</h1>
          <p className="text-mist text-sm mt-1">Тек өзіңе тіркелген оқушылар көрінеді (изоляция).</p>
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

      {students.length === 0 && (
        <Card className="text-center py-12 text-mist">Саған әлі оқушы тағайындалмаған.</Card>
      )}

      {students.length > 0 && (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-light text-left text-xs uppercase text-mist tracking-wide">
                <th className="px-5 py-3 font-medium">Оқушы</th>
                <th className="px-5 py-3 font-medium">Ұпай</th>
                <th className="px-5 py-3 font-medium">Жандар</th>
                <th className="px-5 py-3 font-medium">Күй</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="border-b border-mist-light last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{student.name}</p>
                    <p className="text-mist text-xs">{student.email}</p>
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">{student.points}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <LivesBadge lives={student.lives} size={16} />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setStudentLives(student.id, student.lives - 1)}
                          disabled={student.lives <= 0}
                          className="h-6 w-6 rounded-full border border-mist-light text-mist hover:border-ember hover:text-ember disabled:opacity-30 flex items-center justify-center"
                        >
                          <Minus size={12} />
                        </button>
                        <button
                          onClick={() => setStudentLives(student.id, student.lives + 1)}
                          disabled={student.lives >= DEFAULT_LIVES}
                          className="h-6 w-6 rounded-full border border-mist-light text-mist hover:border-steppe hover:text-steppe disabled:opacity-30 flex items-center justify-center"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge tone={student.status === STUDENT_STATUS.ACTIVE ? "steppe" : "ember"}>
                      {student.status === STUDENT_STATUS.ACTIVE ? "Белсенді" : "Бұғатталған"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
