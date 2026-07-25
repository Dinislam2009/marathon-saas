"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { useData } from "@/context/DataContext";
import { STUDENT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";
import * as actions from "@/app/actions";

export default function MarathonPeoplePage({ params }) {
  const { orgId, marathonId } = use(params);
  const { ready, tick } = useData();

  const [marathon, setMarathon] = useState(null);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("student");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (actions.getMarathonById) {
          const m = await actions.getMarathonById(marathonId);
          setMarathon(m);
        }
        if (actions.getStudentsByMarathonId) {
          const st = await actions.getStudentsByMarathonId(marathonId);
          setStudents(st || []);
        }
        if (actions.getMentorsByMarathonId) {
          const mt = await actions.getMentorsByMarathonId(marathonId);
          setMentors(mt || []);
        }
      } catch (err) {
        console.error("Failed to load people data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (ready) {
      loadData();
    }
  }, [ready, marathonId, tick]);

  if (!ready || loading) return <LoadingState />;

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div>
        <Link
          href={`/org/${orgId}/admin/marathons/${marathonId}`}
          className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-ink w-fit mb-3"
        >
          <ArrowLeft size={14} /> {marathon?.title || "Марафонға қайту"}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-display text-2xl font-semibold text-ink">Адамдар</h1>
        </div>
      </div>

      {/* ДИЗАЙНЫ БҰРЫНҒЫДАЙ ӘДЕМІ ТАБТАР */}
      <div className="inline-flex bg-mist-light/50 p-1 rounded-xl gap-1 w-fit">
        {[
          { key: "student", label: `Оқушылар (${students.length})` },
          { key: "mentor", label: `Менторлар (${mentors.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all",
              tab === t.key
                ? "bg-white text-ink shadow-sm font-semibold"
                : "text-mist hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ОҚУШЫЛАР НЕМЕСЕ МЕНТОРЛАР КЕСТЕСІ */}
      {tab === "student" ? (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-light text-left text-xs uppercase text-mist tracking-wide">
                <th className="px-5 py-3 font-medium">Оқушы</th>
                <th className="px-5 py-3 font-medium">Ментор</th>
                <th className="px-5 py-3 font-medium">Ұпай</th>
                <th className="px-5 py-3 font-medium">Күй</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-mist">
                    Әзірге оқушы жоқ.
                  </td>
                </tr>
              )}
              {students.map((student, index) => (
                <tr
                  key={student.id || `student-${index}`}
                  className="border-b border-mist-light last:border-0"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{student.name || "Аты жоқ"}</p>
                    <p className="text-mist text-xs">{student.email || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-mist">
                    {student.mentor?.name || student.mentorName || "Тағайындалмаған"}
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">
                    {student.points || student.score || 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      tone={
                        student.status === STUDENT_STATUS?.ACTIVE || student.status === "ACTIVE"
                          ? "steppe"
                          : "ember"
                      }
                    >
                      {student.status === STUDENT_STATUS?.ACTIVE || student.status === "ACTIVE"
                        ? "Белсенді"
                        : "Бұғатталған"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-light text-left text-xs uppercase text-mist tracking-wide">
                <th className="px-5 py-3 font-medium">Ментор</th>
                <th className="px-5 py-3 font-medium">Байланыс</th>
                <th className="px-5 py-3 font-medium">Оқушы саны</th>
              </tr>
            </thead>
            <tbody>
              {mentors.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-mist">
                    Әзірге ментор жоқ.
                  </td>
                </tr>
              )}
              {mentors.map((mentor, index) => (
                <tr
                  key={mentor.id || `mentor-${index}`}
                  className="border-b border-mist-light last:border-0"
                >
                  <td className="px-5 py-3.5 font-medium text-ink">
                    {mentor.name || "Аты жоқ"}
                  </td>
                  <td className="px-5 py-3.5 text-mist text-xs">
                    {mentor.phone || "—"} · {mentor.email || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">
                    {mentor._count?.students || mentor.studentsCount || 0}
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