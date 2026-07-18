"use client";

import { use, useState } from "react";
import { Search, Users, Trophy, GraduationCap } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

function KpiCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-start gap-3 bg-white border border-mist-light rounded-2xl">
      <div className="h-10 w-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-mist uppercase tracking-wide mb-1 font-medium">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
}

export default function AdminAllStudentsPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick } = useData();
  const [search, setSearch] = useState("");

  if (!ready) return <LoadingState />;

  // Ұйымға қатысты барлық марафондарды алу
  const marathons = db.getMarathonsByOrg(orgId);
  
  // Барлық марафондардың студенттерін бір тізімге жинау
  const allStudents = marathons.flatMap((m) => {
    const studentsInMarathon = db.getStudentsByMarathon(m.id);
    return studentsInMarathon.map((s) => ({
      ...s,
      marathonTitle: m.title,
    }));
  });

  // Іздеу сүзгісі
  const filteredStudents = allStudents.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.marathonTitle.toLowerCase().includes(q)
    );
  });

  const totalStudents = allStudents.length;
  const totalPoints = allStudents.reduce((sum, s) => sum + (s.points || 0), 0);
  const avgPoints = totalStudents ? Math.round(totalPoints / totalStudents) : 0;

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Барлық қатысушылар</h1>
          <p className="text-mist text-sm mt-1">Ұйым бойынша барлық марафондардың қатысушылар тізімі.</p>
        </div>
        
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Қатысушыны іздеу..."
            className="w-full pl-10 pr-3 py-2 rounded-xl border border-mist-light text-sm focus:outline-none focus:border-ink bg-white"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Жалпы студенттер" value={totalStudents} />
        <KpiCard icon={Trophy} label="Жалпы ұпайлар" value={totalPoints} />
        <KpiCard icon={GraduationCap} label="Орташа балл" value={avgPoints} />
      </div>

      <Card padded={false} className="overflow-hidden bg-white border border-mist-light rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-mist-light text-xs uppercase text-mist tracking-wide font-medium bg-paper-dim/30">
                <th className="px-6 py-4">Аты-жөні / Email</th>
                <th className="px-6 py-4">Марафон</th>
                <th className="px-6 py-4 text-right">Ұпайы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-light bg-white">
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-mist">
                    Студенттер табылмады.
                  </td>
                </tr>
              )}
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-paper-dim/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink text-base">{student.name}</p>
                    <p className="text-mist text-xs">{student.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block bg-paper-dim px-2.5 py-1 rounded-lg text-xs font-medium text-ink">
                      {student.marathonTitle}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-ink text-base">
                    {student.points} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}