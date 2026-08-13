"use client";

import React, { useEffect, useState } from "react";
import { Building2, Flag, Users, DollarSign } from "lucide-react";
import * as actions from "@/app/actions";
import LoadingState from "@/components/LoadingState";
import { useLanguage } from "@/context/LanguageContext";

export default function OwnerDashboardPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const getMetricsFn =
          actions.getOwnerGlobalMetrics || actions.getOwnerGlobalMetricsAction;
        let res = null;

        if (typeof getMetricsFn === "function") {
          res = await getMetricsFn();
        }

        if (res?.ok) {
          setData(res);
        }
      } catch (err) {
        console.error("Owner metrics load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) return <LoadingState />;

  const { metrics, recentOrganizations } = data || {};

  return (
    <div className="space-y-8 w-full pb-12 font-sans text-slate-900">
      {/* HEADER */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[10px] font-black uppercase rounded-lg tracking-wider">
            Super Admin Control
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            {isRu ? "Глобальные метрики" : "Глобалды Метрикалар"}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRu
              ? "B2B показатели и ключевая статистика платформы Loopit."
              : "Loopit платформасының B2B көрсеткіштері мен негізгі статистикасы."}
          </p>
        </div>
      </div>

      {/* 1. ГЛОБАЛДЫ МЕТРИКАЛАР КАРТОЧКАЛАРЫ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Организации (B2B)" : "Ұйымдар (B2B)"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.totalOrganizations || 0}
            </p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Building2 size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Всего марафонов" : "Жалпы Марафондар"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.totalMarathons || 0}
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
            <Flag size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Учащиеся ученики" : "Қатысушы Оқушылар"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {metrics?.totalStudents || 0}
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Прогнозируемый MRR" : "Болжалды MRR"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              ${metrics?.mrr || 0}
            </p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      {/* 2. СОҢҒЫ ТІРКЕЛГЕН ҰЙЫМДАР КЕСТЕСІ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-base font-black text-slate-900">
            {isRu ? "Последние зарегистрированные организации" : "Соңғы тіркелген ұйымдар"}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">{isRu ? "Название организации" : "Ұйым аты"}</th>
                <th className="px-6 py-4">{isRu ? "Email / Телефон" : "Email / Телефон"}</th>
                <th className="px-6 py-4 text-center">{isRu ? "Кол-во марафонов" : "Марафондар саны"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentOrganizations?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-400 font-semibold">
                    {isRu ? "Зарегистрированные организации отсутствуют" : "Тіркелген ұйымдар жоқ"}
                  </td>
                </tr>
              ) : (
                recentOrganizations?.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{org.name}</td>
                    <td className="px-6 py-4 space-y-0.5">
                      <div className="font-semibold text-slate-800">{org.email || "—"}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{org.phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-xl font-extrabold text-[11px]">
                        {org.marathonsCount} {isRu ? "марафон(ов)" : "марафон"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}