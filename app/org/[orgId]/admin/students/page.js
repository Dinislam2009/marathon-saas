"use client";

import { use, useState, useEffect } from "react";
import { Search, Users, Trophy, GraduationCap, Plus, X, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";
import AddStudentModal from "@/components/ui/AddStudentModal";

function KpiCard({ icon: Icon, label, value }) {
  return (
    <Card className="flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-horizon/10 flex items-center justify-center text-horizon-dark shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-mist uppercase tracking-wide mb-1">{label}</p>
        <p className="font-display text-2xl font-semibold text-ink">{value}</p>
      </div>
    </Card>
  );
}

export default function AdminAllStudentsPage({ params }) {
  const resolvedParams = use(params);
  const orgId = resolvedParams.orgId;

  const [marathons, setMarathons] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const mList = await actions.getMarathonsByOrgId(orgId);
      setMarathons(mList || []);

      if ("getAllStudentsByOrg" in actions) {
        const sList = await actions.getAllStudentsByOrg(orgId);
        setAllStudents(sList || []);
      } else {
        setAllStudents([]);
      }
    } catch (err) {
      console.error("Data load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  if (isLoading) return <LoadingState />;

  const filteredStudents = allStudents.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      (s.marathonTitle && s.marathonTitle.toLowerCase().includes(q))
    );
  });

  const totalStudents = allStudents.length;
  const totalPoints = allStudents.reduce((sum, s) => sum + (s.points || 0), 0);
  const avgPoints = totalStudents ? Math.round(totalPoints / totalStudents) : 0;

  // Студентті марафонға қосу функциясы
  async function handleAddStudent(marathonId, studentData) {
    if (actions.addStudentToMarathon) {
      await actions.addStudentToMarathon(marathonId, studentData);
    }
    await loadData(); // Тізімді жаңарту
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Барлық қатысушылар</h1>
          <p className="text-mist text-sm mt-1">Ұйымның барлық марафондарының қатысушылары бір жерде.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Қатысушыны іздеу..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-mist-light text-sm bg-white"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus size={16} /> Қатысушы қосу
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Барлық қатысушы" value={totalStudents} />
        <KpiCard icon={Trophy} label="Жалпы балл" value={totalPoints} />
        <KpiCard icon={GraduationCap} label="Орташа балл" value={avgPoints} />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-mist-light text-xs uppercase text-mist tracking-wide">
                <th className="px-5 py-3 font-medium">Аты-жөні / Байланыс</th>
                <th className="px-5 py-3 font-medium">Марафон</th>
                <th className="px-5 py-3 font-medium text-right">Баллдар</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-mist">
                    Қатысушылар табылмады.
                  </td>
                </tr>
              )}
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-mist-light last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{student.name}</p>
                    <p className="text-mist text-xs">{student.phone || student.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block bg-paper-dim px-2.5 py-1 rounded-lg text-xs font-medium text-ink">
                      {student.marathonTitle || "Марафон"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-ink">{student.points || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Жаңа бөлек компонент түріндегі модалка */}
 <AddStudentModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  marathons={marathons}
  onAdd={handleAddStudent}
  onCheckStudent={async (value, isEmail, marathonId) => {
    // 1. Жалпы базадан студентті табамыз
    const existingStudent = allStudents.find((s) => 
      isEmail ? s.email?.toLowerCase() === value.toLowerCase() : s.phone === value
    );

    // Егер базада мүлде жоқ болса
    if (!existingStudent) {
      return { student: null, status: "not_found" };
    }

    // 2. Дәл осы марафонға тіркеліп қойғанын тексереміз
    // (Егер студенттің марафоны сәйкес келсе немесе қатысушылар тізімінде осы марафон көрсетілсе)
    const isOwnerOfThisMarathon = existingStudent.marathonId === marathonId || existingStudent.marathon_id === marathonId;
    if (isOwnerOfThisMarathon) {
      return { student: existingStudent, status: "already_in_this_marathon" };
    }

    // 3. Басқа марафонда бар екенін тексереміз
    const isInAnotherMarathon = Boolean(existingStudent.marathonId || existingStudent.marathon_id);
    if (isInAnotherMarathon) {
      return { student: existingStudent, status: "in_another_marathon" };
    }

    // 4. Базада бар, бірақ ешқандай марафонға қосылмаған (таза оқушы)
    return { student: existingStudent, status: "found" };
  }}
/>
    </div>
  );
}