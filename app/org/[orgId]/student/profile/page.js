"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import LoadingState from "@/components/ui/LoadingState";

// --- ⚡ СЕРВЕРЛІК ACTION-ДАРДЫ ИМПОРТТАУ (ДЕРЕКТЕР ҚОРЫМЕН ТІКЕЛЕЙ БАЙЛАНЫС ТАЗАЛАНДЫ) ---
import { 
  logoutAction, 
  getProfileDataAction 
} from "@/app/actions";

export default function ProfilePage({ params }) {
  const { orgId } = use(params);
  const router = useRouter();
  const { ready, tick, currentStudentId, setCurrentStudentId } = useData();

  // Серверден келетін деректерді сақтау күйі (State)
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Студент өзгергенде немесе бет жүктелгенде деректерді серверден қауіпсіз алу
  useEffect(() => {
    if (!ready || !currentStudentId) return;

    async function fetchProfileData() {
      setLoading(true);
      const res = await getProfileDataAction(currentStudentId, orgId);
      if (res.ok) {
        setProfileData(res.data);
      }
      setLoading(false);
    }

    fetchProfileData();
  }, [ready, currentStudentId, orgId]);

  // Серверлік Action арқылы жүйеден шығу
  async function handleLogout() {
    await logoutAction();
    localStorage.removeItem("current_user_id"); // Сессияны тазалау
    router.push("/login");
  }

  if (!ready || !currentStudentId || loading) return <LoadingState />;

  const { student, marathon, authUser, students = [] } = profileData || {};

  return (
    <div key={tick} className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold text-ink">Профиль</h1>

      <Card className="bg-gradient-to-tr from-ink to-dusk text-white border-none relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-horizon flex items-center justify-center text-xl font-bold shrink-0">
            {student?.name?.[0]}
          </div>
          <div>
            <h3 className="font-extrabold text-base leading-tight">{student?.name}</h3>
            <p className="text-xs text-white/60 mt-1">{marathon?.title}</p>
          </div>
        </div>
        <div className="mt-4">
          <span className="text-xs text-white/70">{student?.points} баллов</span>
        </div>
      </Card>

      {authUser && (
        <Card>
          <p className="text-xs text-mist uppercase tracking-wide mb-2">Аккаунт</p>
          <p className="text-sm text-ink font-medium">{authUser.firstName} {authUser.lastName}</p>
          <p className="text-xs text-mist mt-0.5">{authUser.email} · {authUser.phone}</p>
        </Card>
      )}

      <Card>
        <p className="text-xs text-mist uppercase tracking-wide mb-3">
          Просмотр в роли (до полного подключения авторизации)
        </p>
        <select
          value={currentStudentId || ""}
          onChange={(e) => setCurrentStudentId(e.target.value)}
          className="w-full rounded-xl border border-mist-light px-3.5 py-2.5 text-sm bg-white"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Card>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-2 text-sm font-medium text-ember py-3 rounded-xl border border-ember/20 bg-ember-light w-full"
      >
        <LogOut size={16} /> Выйти
      </button>
    </div>
  );
}