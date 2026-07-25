"use client";

import { use, useEffect, useState } from "react";
import { UserPlus, Search, Trophy, GraduationCap, Users } from "lucide-react";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import * as actions from "@/app/actions";

export default function StudentsPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick } = useData();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      if (typeof actions.getStudentsByOrgId === "function") {
        const res = await actions.getStudentsByOrgId(orgId);
        setStudents(res || []);
      }
    } catch (err) {
      console.error("Failed to load students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchData();
    }
  }, [ready, orgId, tick]);

  if (!ready || loading) return <LoadingState />;

  // Іздеу фильтрі
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase();
    const name = (s.name || s.fullName || "").toLowerCase();
    const email = (s.email || "").toLowerCase();
    const phone = (s.phone || "").toLowerCase();
    const marathon = (s.marathon?.title || s.marathonTitle || "").toLowerCase();

    return (
      name.includes(query) ||
      email.includes(query) ||
      phone.includes(query) ||
      marathon.includes(query)
    );
  });

  // Статистика
  const totalStudents = students.length;
  const totalPoints = students.reduce((acc, curr) => acc + (curr.points || curr.score || 0), 0);
  const avgPoints = totalStudents > 0 ? Math.round(totalPoints / totalStudents) : 0;

  return (
    <div key={tick} className="flex flex-col gap-6">
      {/* Бас тақырып және Іздеу / Қосу */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Барлық Қатысушылар
          </h1>
          <p className="text-xs text-mist mt-1">
            Ұйымның барлық марафондарының қатысушылары бір жерде.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
            <input
              type="text"
              placeholder="Қатысушыны іздеу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-mist-light pl-9 pr-4 py-2.5 text-xs text-ink placeholder-mist outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all bg-white"
            />
          </div>

          <Button className="gap-2 text-xs">
            <UserPlus size={16} /> Қатысушы қосу
          </Button>
        </div>
      </div>

      {/* Статистикалық плашкалар */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 bg-white border border-mist-light rounded-2xl">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-mist uppercase">БАРЛЫҚ ҚАТЫСУШЫ</p>
            <p className="text-2xl font-bold text-ink mt-0.5">{totalStudents}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white border border-mist-light rounded-2xl">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-mist uppercase">ЖАЛПЫ БАЛЛ</p>
            <p className="text-2xl font-bold text-ink mt-0.5">{totalPoints}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 bg-white border border-mist-light rounded-2xl">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-mist uppercase">ОРТАША БАЛЛ</p>
            <p className="text-2xl font-bold text-ink mt-0.5">{avgPoints}</p>
          </div>
        </Card>
      </div>

      {/* Негізгі Кесте */}
      <Card padded={false} className="overflow-hidden bg-white border border-mist-light rounded-2xl">
        <table className="w-full text-sm text-left text-ink">
          <thead className="bg-mist-light/30 text-xs uppercase text-mist font-semibold">
            <tr>
              <th className="p-4">АТЫ-ЖӨНІ</th>
              <th className="p-4">EMAIL</th>
              <th className="p-4">ТЕЛЕФОН</th>
              <th className="p-4">МАРАФОН</th>
              <th className="p-4 text-right">БАЛЛДАР</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-mist">
                  Қатысушылар табылмады.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => (
                <tr
                  key={student.id || `student-${index}`}
                  className="border-b border-mist-light last:border-0 hover:bg-paper-dim/10 transition-colors"
                >
                  {/* Аты-жөні */}
                  <td className="p-4 font-medium text-ink">
                    {student.name || student.fullName || (student.user ? `${student.user.firstName} ${student.user.lastName}` : "Аты-жөні жоқ")}
                  </td>

                  {/* Email */}
                  <td className="p-4 text-mist">
                    {student.email || student.user?.email || "—"}
                  </td>

                  {/* Телефон */}
                  <td className="p-4 text-mist">
                    {student.phone || student.user?.phone || "—"}
                  </td>

                  {/* Марафон */}
                  <td className="p-4">
                    <span className="inline-block px-2.5 py-1 text-xs font-medium bg-mist-light/50 text-ink rounded-lg">
                      {student.marathon?.title || student.marathonTitle || "—"}
                    </span>
                  </td>

                  {/* Баллдар */}
                  <td className="p-4 font-bold text-ink text-right">
                    {student.points ?? student.score ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}