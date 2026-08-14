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
  const [claimingId, setClaimingId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const managerId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;
      const getDashFn = actions.getManagerDashboardData || actions.getManagerDashboardData;

      if (typeof getDashFn === "function") {
        const res = await getDashFn(managerId);
        setUnassigned(res?.unassignedStudents || []);
      }
    } catch (err) {
      console.error("Fetch unassigned error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClaim = async (studentId) => {
    if (claimingId) return;
    setClaimingId(studentId);

    try {
      const managerId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;
      const claimFn = actions.claimUnassignedStudent || actions.claimUnassignedStudent;

      if (typeof claimFn === "function") {
        await claimFn(studentId, null, managerId);
        await fetchData();
      }
    } catch (err) {
      console.error("Claim student error:", err);
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden font-sans text-slate-900 pb-12">
      <div className="p-5 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-500">
          {isRu 
            ? "Эти ученики зарегистрировались самостоятельно. Заберите их себе в CRM!" 
            : "Бұл оқушылар өзі тіркелген. Оларды өзіңіздің CRM базаңызға алыңыз!"}
        </p>
      </div>

      <div className="overflow-x-auto">
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
                  <td className="px-6 py-4 font-bold text-slate-900">{s.name || "—"}</td>
                  <td className="px-6 py-4 font-mono">{s.phone || "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      disabled={claimingId === s.id}
                      onClick={() => handleClaim(s.id)}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {claimingId === s.id 
                        ? (isRu ? "Забираем..." : "Алынуда...") 
                        : (isRu ? "Забрать себе" : "Өзіме алу")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}