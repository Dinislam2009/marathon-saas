"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Clock, X } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import { STUDENT_STATUS, ROLES } from "@/lib/constants";
import { formatKzPhone } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

const EMPTY_INVITE = { fullName: "", phone: "+7", email: "" };

function InviteModal({ role, marathonId, orgId, onClose }) {
  const { addInvitation } = useData();
  const [form, setForm] = useState(EMPTY_INVITE);
  const label = role === ROLES.MENTOR ? "Ментор" : "Оқушы";

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.email.trim()) return;
    addInvitation(marathonId, orgId, role, form);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-display text-lg font-semibold text-ink">{label} қосу</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-mist hover:bg-paper-dim">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-mist mb-5">
          Дерек сақталады да, осы email/телефонмен адам тіркелген сәтте {label.toLowerCase()} доступы автоматты ашылады.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Аты-жөні</span>
            <input
              required
              autoFocus
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Телефон нөмірі</span>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: formatKzPhone(e.target.value) })}
              placeholder="+7 (7XX) XXX-XX-XX"
              className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-ink">Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-mist-light px-3.5 py-2.5 text-sm"
            />
          </label>

          <Button type="submit" size="lg" className="mt-2 w-full">
            Доступ беру
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function MarathonPeoplePage({ params }) {
  const { orgId, marathonId } = use(params);
  const { ready, tick, assignMentorToStudent } = useData();
  const [tab, setTab] = useState(ROLES.STUDENT);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!ready) return <LoadingState />;

  const marathon = db.getMarathon(marathonId);
  const mentors = db.getMentorsByOrg(orgId);
  const students = db.getStudentsByMarathon(marathonId).slice().sort((a, b) => b.points - a.points);
  const invitations = db.getInvitationsByMarathon(marathonId);
  const pendingInvites = invitations.filter((i) => i.status === "pending" && i.role === tab);

  return (
    <div key={tick} className="flex flex-col gap-6">
      <div>
        <Link
          href={`/org/${orgId}/admin/marathons/${marathonId}`}
          className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-ink w-fit mb-3"
        >
          <ArrowLeft size={14} /> {marathon?.title}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-display text-2xl font-semibold text-ink">Адамдар</h1>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} /> Адам қосу
          </Button>
        </div>
      </div>

      <div className="flex gap-1 bg-paper-dim rounded-xl p-1 w-fit">
        {[
          { key: ROLES.STUDENT, label: `Оқушылар (${students.length})` },
          { key: ROLES.MENTOR, label: `Менторлар (${mentors.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t.key ? "bg-white text-horizon-dark shadow-sm" : "text-mist hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === ROLES.STUDENT ? (
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
                  <td colSpan={4} className="px-5 py-10 text-center text-mist">Әзірге оқушы жоқ.</td>
                </tr>
              )}
              {students.map((student) => (
                <tr key={student.id} className="border-b border-mist-light last:border-0">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{student.name}</p>
                    <p className="text-mist text-xs">{student.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <select
                      value={student.mentorId || ""}
                      onChange={(e) => assignMentorToStudent(student.id, e.target.value || null)}
                      className="rounded-lg border border-mist-light px-2 py-1.5 text-xs bg-white"
                    >
                      <option value="">Тағайындалмаған</option>
                      {mentors.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-ink font-medium">{student.points}</td>
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
                  <td colSpan={3} className="px-5 py-10 text-center text-mist">Әзірге ментор жоқ.</td>
                </tr>
              )}
              {mentors.map((mentor) => (
                <tr key={mentor.id} className="border-b border-mist-light last:border-0">
                  <td className="px-5 py-3.5 font-medium text-ink">{mentor.name}</td>
                  <td className="px-5 py-3.5 text-mist text-xs">{mentor.phone} · {mentor.email}</td>
                  <td className="px-5 py-3.5 text-ink font-medium">{db.getStudentsByMentor(mentor.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {pendingInvites.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-mist mb-3 flex items-center gap-1.5">
            <Clock size={12} /> Күтудегі шақырулар
          </p>
          <div className="flex flex-col gap-2">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="!p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{invite.fullName}</p>
                  <p className="text-xs text-mist">{invite.phone} · {invite.email}</p>
                </div>
                <Badge tone="horizon">Тіркелуін күтуде</Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {inviteOpen && (
        <InviteModal role={tab} marathonId={marathonId} orgId={orgId} onClose={() => setInviteOpen(false)} />
      )}
    </div>
  );
}
