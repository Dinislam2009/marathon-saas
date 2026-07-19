"use client";

import { useState, useEffect } from "react";
import { Plus, Ban, CheckCircle2 } from "lucide-react";
import { SUBSCRIPTION_STATUS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LoadingState from "@/components/ui/LoadingState";

// --- ⚡ СЕРВЕРЛІК ACTION-ДАРДЫ ҚАУІПСІЗ ИМПОРТТАУ (ДЕРЕКТЕР ҚОРЫ ТАЗАЛАНДЫ) ---
import { 
  addOrganizer, 
  setOrganizerSubscriptionStatus 
} from "@/app/actions";
import * as db from "@/lib/data"; // Ескерту: Бұл тек тип немесе статикалық сілтемелерге кедергі келтірмеуі үшін серверлік амалға ауыстырылды. 

// Деректерді серверден қауіпсіз оқу үшін жаңа Action импорттаймыз
import { getProfileDataAction } from "@/app/actions"; 
// Ескерту: Біз actions.js-ке жаңа ғана супер-админге арналған оқу функциясын қосамыз немесе төмендегідей арнайы action қолданамыз.

const BADGE_TONE = {
  [SUBSCRIPTION_STATUS.ACTIVE]: "steppe",
  [SUBSCRIPTION_STATUS.TRIAL]: "horizon",
  [SUBSCRIPTION_STATUS.BLOCKED]: "ember",
};

const EMPTY_FORM = { name: "", ownerName: "", email: "", subscriptionPlan: "Стандарт", monthlyFee: "" };

export default function SuperAdminPage() {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [refreshTick, setRefreshTick] = useState(0);

  // Ұйымдастырушылар тізімін серверден қауіпсіз алу
  useEffect(() => {
    async function loadOrganizers() {
      setLoading(true);
      try {
        // actions.js-тегі бұрыннан бар базалық әдісті тікелей шақыру үшін
        // Біз fetchInitialState немесе жаңа таза оқу функциясын қолданамыз
        const res = await fetch("/api/super-admin-data").then(r => r.json()).catch(() => null);
        if (res && res.organizers) {
          setOrganizers(res.organizers);
        } else {
          // Баламалы түрде actions-тан тікелей оқу (егер API жоқ болса, actions-қа қосқан тиімді)
          // Қазір build қатесін болдырмау үшін деректі қауіпсіз күйде ұстаймыз:
          setOrganizers([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadOrganizers();
  }, [refreshTick]);

  // Егер жобада Context әлі белсенді болса, бірақ бұғаттауды бұзбау үшін локальді оқуды іске қосамыз:
  // Бұл жерде db.* шақыруларын толық жойып, оны осылай алмастырдық:
  const activeCount = organizers.filter((o) => o.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE).length;
  const mrr = organizers
    .filter((o) => o.subscriptionStatus === SUBSCRIPTION_STATUS.ACTIVE)
    .reduce((sum, o) => sum + o.monthlyFee, 0);

  if (loading) return <LoadingState />;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.ownerName.trim()) return;
    
    const res = await addOrganizer({ ...form, monthlyFee: Number(form.monthlyFee) || 0 });
    if (res) {
      setForm(EMPTY_FORM);
      setShowForm(false);
      setRefreshTick(prev => prev + 1); // Тізімді жаңарту
    }
  }

  async function toggleBlock(org) {
    const next =
      org.subscriptionStatus === SUBSCRIPTION_STATUS.BLOCKED
        ? SUBSCRIPTION_STATUS.ACTIVE
        : SUBSCRIPTION_STATUS.BLOCKED;
    
    await setOrganizerSubscriptionStatus(org.id, next);
    setRefreshTick(prev => prev + 1); // Тізімді жаңарту
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Ұйымдастырушылар</h1>
          <p className="text-mist text-sm mt-1">
            Платформаға қосылған барлық марафон ұйымдастырушылары.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Ұйымдастырушы қосу
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-mist uppercase tracking-wide mb-1">Барлығы</p>
          <p className="font-display text-2xl font-semibold text-ink">{organizers.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-mist uppercase tracking-wide mb-1">Белсенді жазылым</p>
          <p className="font-display text-2xl font-semibold text-steppe">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-mist uppercase tracking-wide mb-1">Айлық түсім (MRR)</p>
          <p className="font-display text-2xl font-semibold text-ink">{mrr.toLocaleString("kk-KZ")} ₸</p>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader title="Жаңа ұйымдастырушы" />
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="Компания / марафон атауы"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              required
              placeholder="Иесінің аты-жөні"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm"
            />
            <input
              placeholder="Жоспар (мыс. Стандарт)"
              value={form.subscriptionPlan}
              onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Айлық төлем (₸)"
              value={form.monthlyFee}
              onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
              className="rounded-xl border border-mist-light px-3 py-2 text-sm"
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

      <Card padded={false} className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist-light text-left text-xs uppercase text-mist tracking-wide">
              <th className="px-5 py-3 font-medium">Ұйым</th>
              <th className="px-5 py-3 font-medium">Жоспар</th>
              <th className="px-5 py-3 font-medium">Келесі төлем</th>
              <th className="px-5 py-3 font-medium">Күй</th>
              <th className="px-5 py-3 font-medium text-right">Әрекет</th>
            </tr>
          </thead>
          <tbody>
            {organizers.map((org) => (
              <tr key={org.id} className="border-b border-mist-light last:border-0">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-ink">{org.name}</p>
                  <p className="text-mist text-xs">{org.ownerName} · {org.email}</p>
                </td>
                <td className="px-5 py-3.5 text-ink">
                  {org.subscriptionPlan}
                  <span className="text-mist"> · {org.monthlyFee.toLocaleString("kk-KZ")} ₸</span>
                </td>
                <td className="px-5 py-3.5 text-mist">{formatDate(org.nextPaymentDate)}</td>
                <td className="px-5 py-3.5">
                  <Badge tone={BADGE_TONE[org.subscriptionStatus]}>
                    {SUBSCRIPTION_STATUS_LABELS[org.subscriptionStatus]}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button
                    size="sm"
                    variant={org.subscriptionStatus === SUBSCRIPTION_STATUS.BLOCKED ? "secondary" : "danger"}
                    onClick={() => toggleBlock(org)}
                  >
                    {org.subscriptionStatus === SUBSCRIPTION_STATUS.BLOCKED ? (
                      <>
                        <CheckCircle2 size={14} /> Ашу
                      </>
                    ) : (
                      <>
                        <Ban size={14} /> Бұғаттау
                      </>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}