"use client";

import React, { useState, useEffect, useCallback } from "react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function UnassignedStudentsPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [loading, setLoading] = useState(true);
  const [unassigned, setUnassigned] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const managerId = localStorage.getItem("current_user_id");
    const res = await actions.getManagerDashboardDataAction(managerId);
    setUnassigned(res?.unassignedStudents || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden font-sans text-slate-900 pb-12">
      <div className="p-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500">
          {isRu ? "Эти ученики зарегистрировались самостоятельно. Заберите их себе в CRM!" : "Бұл оқушылар өзі тіркелген. Оларды өзіңіздің CRM базаңызға алыңыз!"}
        </p>
      </div>

      <table className="w-full text-left text-xs font-medium text-slate-600">
        <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
          <tr>
            <th className="px-6 py-4">{isRu ? "Имя" : "Аты"}</th>
            <th className="px-6 py-4">{isRu ? "Телефон" : "Телефоны"}</th>
            <th className="px-6 py-4 text-right">{isRu ? "Действие" : "Әрекет"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {unassigned.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-semibold">
                {isRu ? "Нет нераспределенных учеников." : "Бос оқушылар жоқ."}
              </td>
            </tr>
          ) : (
            unassigned.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60 transition">
                <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                <td className="px-6 py-4 font-mono">{s.phone || "—"}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={async () => {
                      const managerId = localStorage.getItem("current_user_id");
                      await actions.claimUnassignedStudentAction(s.id, null, managerId);
                      fetchData();
                    }}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isRu ? "Забрать себе" : "Өзіме алу"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}