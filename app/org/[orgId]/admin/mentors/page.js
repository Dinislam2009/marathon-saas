"use client";

import { use, useState } from "react";
import { UserCog, Plus, Users } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { formatKzPhone } from "@/lib/utils";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

const EMPTY = { name: "", phone: "+7", email: "" };

export default function MentorsPage({ params }) {
  const { orgId } = use(params);
  const { ready, tick, addMentor } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  if (!ready) return <LoadingState />;

  const mentors = db.getMentorsByOrg(orgId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    addMentor(orgId, form);
    setForm(EMPTY);
    setShowForm(false);
  }

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Менторлар</h1>
          <p className="text-mist text-sm mt-1">
            Әр ментор тек өзіне тіркелген оқушыларды көреді.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Ментор қосу
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Жаңа ментор" />
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
            <input
              required
              autoFocus
              placeholder="Аты-жөні"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="+7 (7XX) XXX-XX-XX"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatKzPhone(e.target.value) })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email (міндетті емес)"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm sm:col-span-2"
            />
            <div className="sm:col-span-2 flex gap-2 justify-end mt-1">
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Бас тарту
              </Button>
              <Button type="submit">Қосу</Button>
            </div>
          </form>
        </Card>
      )}

      {mentors.length === 0 && (
        <Card className="text-center py-12">
          <UserCog size={24} className="mx-auto text-mist mb-2" />
          <p className="text-mist">Әзірге ментор қосылмаған.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {mentors.map((mentor) => {
          const studentCount = db.getStudentsByMentor(mentor.id).length;
          return (
            <Card key={mentor.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{mentor.name}</p>
                <p className="text-xs text-mist mt-0.5">{mentor.phone}</p>
                {mentor.email && <p className="text-xs text-mist">{mentor.email}</p>}
              </div>
              <span className="flex items-center gap-1.5 text-xs font-bold text-horizon-dark bg-horizon/10 px-2.5 py-1.5 rounded-full shrink-0">
                <Users size={12} /> {studentCount}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
