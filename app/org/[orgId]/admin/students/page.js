"use client";

import { use, useState } from "react";
import { Search, Users, Trophy, GraduationCap, Plus, X, Phone } from "lucide-react";
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
  const { ready, tick, refreshData } = useData();
  const [search, setSearch] = useState("");
  
  // Модалка мен форманың күйлері
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", marathonId: "" });
  const [error, setError] = useState("");

  if (!ready) return <LoadingState />;

  const marathons = db.getMarathonsByOrg(orgId);
  
  const allStudents = marathons.flatMap((m) => {
    const studentsInMarathon = db.getStudentsByMarathon(m.id);
    return studentsInMarathon.map((s) => ({
      ...s,
      marathonTitle: m.title,
    }));
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.phone || !formData.marathonId) {
      setError("Аты-жөні, телефон және марафон өрістері міндетті!");
      return;
    }

    try {
      db.addStudentToMarathon(formData.marathonId, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });

      setFormData({ name: "", email: "", phone: "", marathonId: "" });
      setIsModalOpen(false);
      if (refreshData) refreshData();
    } catch (err) {
      setError("Қатысушыны қосу кезінде қате шықты.");
    }
  };

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Барлық қатысушылар</h1>
          <p className="text-mist text-sm mt-1">Ұйым бойынша барлық марафондардың қатысушылар тізімі.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Қатысушыны іздеу..."
              className="w-full pl-10 pr-3 py-2 rounded-xl border border-mist-light text-sm focus:outline-none focus:border-ink bg-white text-ink"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-black hover:bg-black/95 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto shrink-0 shadow-sm"
          >
            <Plus size={16} />
            Қатысушы қосу
          </button>
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
                <th className="px-6 py-4">Аты-жөні / Байланыс</th>
                <th className="px-6 py-4">Марафон</th>
                <th className="px-6 py-4 text-right">Ұпайы</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist-light bg-white">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-paper-dim/10 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink text-base">{student.name}</p>
                    <p className="text-mist text-xs">{student.phone || student.email}</p>
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

      {/* МОДАЛКА */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl border border-mist-light overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-mist-light">
              <h3 className="font-display font-semibold text-ink text-lg">Жаңа қатысушы қосу</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-mist hover:text-ink transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-lg border border-rose-100">{error}</p>}
              
              <div>
                <label className="block text-xs font-medium text-mist uppercase tracking-wider mb-1.5">Аты-жөні</label>
                <input required placeholder="Нұрлан Әбенов" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border border-mist-light text-sm focus:outline-none focus:border-ink" />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-mist uppercase tracking-wider mb-1.5">Телефон нөмірі</label>
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-mist-light focus-within:border-ink">
                    <Phone size={16} className="text-mist" />
                    <input type="tel" required placeholder="+7 (707) 000-00-00" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full text-sm focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-mist uppercase tracking-wider mb-1.5">Марафон</label>
                <select required value={formData.marathonId} onChange={(e) => setFormData({...formData, marathonId: e.target.value})} className="w-full px-3.5 py-2 rounded-xl border border-mist-light text-sm focus:outline-none focus:border-ink bg-white">
                  <option value="">-- Марафонды таңдау --</option>
                  {marathons.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2 mt-2 border-t border-mist-light">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl border border-mist-light text-sm font-medium text-mist hover:bg-paper-dim">Бас тарту</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-black text-white text-sm font-medium hover:bg-black/90">Қосу</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}