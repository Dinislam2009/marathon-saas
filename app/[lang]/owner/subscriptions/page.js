"use client";

import React, { useEffect, useState } from "react";
import { Zap, Check, ShieldCheck, Calendar, Save, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import LoadingState from "@/components/LoadingState";

export default function OwnerSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [orgs, setOrgs] = useState([]);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    async function loadData() {
      const res = await actions.getAllOrganizations();
      if (res.ok) setOrgs(res.organizations || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async (orgId, subData) => {
    setSavingId(orgId);
    const res = await actions.updateOrgSubscriptionAction(orgId, subData);
    if (res.ok) {
      alert("Тариф пен лимиттер сәтті жаңартылды!");
    } else {
      alert("Қате: " + res.error);
    }
    setSavingId(null);
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900">
      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Тарифтер мен Лимиттерді Басқару
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Әрбір ұйымға жеке тариф тағайындау, оқушылар мен марафондар лимитін қою.
        </p>
      </div>

      {/* ORGANIZATIONS SUBSCRIPTION LIST */}
      <div className="grid grid-cols-1 gap-4">
        {orgs.map((org) => (
          <OrgSubscriptionCard
            key={org.id}
            org={org}
            onSave={handleSave}
            isSaving={savingId === org.id}
          />
        ))}
      </div>
    </div>
  );
}

function OrgSubscriptionCard({ org, onSave, isSaving }) {
  const [plan, setPlan] = useState(org.plan || "FREE");
  const [maxStudents, setMaxStudents] = useState(org.maxStudents || 50);
  const [maxMarathons, setMaxMarathons] = useState(org.maxMarathons || 2);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-black text-slate-900">{org.name}</h3>
          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-extrabold rounded-lg uppercase">
            {plan}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{org.email} • {org.phone}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {/* Тариф таңдау */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Тариф</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
          >
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>

        {/* Оқушылар лимиті */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Макс. Оқушы</label>
          <input
            type="number"
            value={maxStudents}
            onChange={(e) => setMaxStudents(e.target.value)}
            className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
          />
        </div>

        {/* Марафондар лимиті */}
        <div>
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Макс. Марафон</label>
          <input
            type="number"
            value={maxMarathons}
            onChange={(e) => setMaxMarathons(e.target.value)}
            className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
          />
        </div>

        {/* Сақтау батырмасы */}
        <div className="self-end">
          <button
            onClick={() => onSave(org.id, { plan, maxStudents, maxMarathons })}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save size={14} />}
            Сақтау
          </button>
        </div>
      </div>
    </div>
  );
}