"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { logout, getCurrentUser } from "@/lib/auth";
import Card from "@/components/ui/Card";
import LivesBadge from "@/components/ui/LivesBadge";
import LoadingState from "@/components/ui/LoadingState";

export default function ProfilePage({ params }) {
  const { orgId } = use(params);
  const router = useRouter();
  const { ready, tick, currentStudentId, setCurrentStudentId } = useData();

  if (!ready || !currentStudentId) return <LoadingState />;

  const student = db.getStudent(currentStudentId);
  const marathon = db.getMarathonForStudent(currentStudentId);
  const authUser = getCurrentUser();
  const students = db.getMarathonsByOrg(orgId).flatMap((m) => db.getStudentsByMarathon(m.id));

  function handleLogout() {
    logout();
    router.push("/login");
  }

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
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-white/70">{student?.points} ұпай</span>
          <LivesBadge lives={student?.lives ?? 0} size={16} />
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
          Демо ретінде көру (авторизация толық қосылғанша)
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
        className="flex items-center justify-center gap-2 text-sm font-medium text-ember py-3 rounded-xl border border-ember/20 bg-ember-light"
      >
        <LogOut size={16} /> Шығу
      </button>
    </div>
  );
}
