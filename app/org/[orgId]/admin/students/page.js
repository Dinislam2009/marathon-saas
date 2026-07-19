"use client";

import { use, useState } from "react";
import { Search, Users, Trophy, GraduationCap, Plus, X } from "lucide-react";
import * as actions from "@/app/actions";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

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

const EMPTY_FORM = { name: "", email: "", phone: "", marathonId: "" };

export default function AdminAllStudentsPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick, addStudentToMarathon } = useData();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  if (!ready) return <LoadingState />;

  const marathons = db.getMarathonsByOrg(orgId);
  const allStudents = marathons.flatMap((m) =>
    db.getStudentsByMarathon(m.id).map((s) => ({ ...s, marathonTitle: m.title }))
  );

  const filteredStudents = allStudents.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.email && s.email.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q)) ||
      s.marathonTitle.toLowerCase().includes(q)
    );
  });

  const totalStudents = allStudents.length;
  const totalPoints = allStudents.reduce((sum, s) => sum + (s.points || 0), 0);
  const avgPoints = totalStudents ? Math.round(totalPoints / totalStudents) : 0;

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.marathonId) {
      setError("Имя, телефон и марафон — обязательные поля.");
      return;
    }
    addStudentToMarathon(form.marathonId, {
      name: form.name,
      email: form.email,
      phone: form.phone,
    });
    setForm(EMPTY_FORM);
    setIsModalOpen(false);
  }

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Все участники</h1>
          <p className="text-mist text-sm mt-1">Участники всех марафонов организации в одном месте.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск участника..."
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-mist-light text-sm bg-white"
            />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
            <Plus size={16} /> Добавить участника
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard icon={Users} label="Всего участников" value={totalStudents} />
        <KpiCard icon={Trophy} label="Всего баллов" value={totalPoints} />
        <KpiCard icon={GraduationCap} label="Средний балл" value={avgPoints} />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-mist-light text-xs uppercase text-mist tracking-wide">
                <th className="px-5 py-3 font-medium">Имя / Контакт</th>
                <th className="px-5 py-3 font-medium">Марафон</th>
                <th className="px-5 py-3 font-medium text-right">Баллы</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-10 text-center text-mist">Участники не найдены.</td></tr>
              )}
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-mist-light last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{student.name}</p>
                    <p className="text-mist text-xs">{student.phone || student.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-block bg-paper-dim px-2.5 py-1 rounded-lg text-xs font-medium text-ink">
                      {student.marathonTitle}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-ink">{student.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-semibold text-ink">Добавить участника</h3>
              <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-mist hover:bg-paper-dim">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Марафон</span>
                <select
                  required
                  value={form.marathonId}
                  onChange={(e) => setForm({ ...form, marathonId: e.target.value })}
                  className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm bg-white"
                >
                  <option value="">Выберите марафон</option>
                  {marathons.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Имя</span>
                <input
                  required
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Телефон</span>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+7 (7XX) XXX-XX-XX"
                  className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-ink">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
                />
              </label>

              {error && <p className="text-xs text-ember bg-ember-light rounded-lg px-3 py-2">{error}</p>}

              <Button type="submit" size="lg" className="mt-2 w-full">
                Добавить
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}