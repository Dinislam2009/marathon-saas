"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, MessageSquare, Layers, Users } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function MyStudentsCRMPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const managerId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;
      
      let list = [];
      const getDashFn = actions.getManagerDashboardData || actions.getManagerDashboardData;
      if (typeof getDashFn === "function" && managerId) {
        const res = await getDashFn(managerId);
        list = res?.myStudents || [];
      }
      
      // Егер бос болса, тікелей оқушылар тізімін алып көру
      const getStudentsFn = actions.getStudentsByOrgId || actions.getStudentsByOrgId;
      if (list.length === 0 && typeof getStudentsFn === "function") {
        const orgId = typeof window !== "undefined" ? localStorage.getItem("current_org_id") : null;
        if (orgId) {
          list = await getStudentsFn(orgId);
        }
      }

      setStudents(list || []);
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;

  const textQuery = searchQuery.trim().toLowerCase();
  const cleanDigitsQuery = searchQuery.replace(/\D/g, "");

  const filtered = students.filter((s) => {
    const nameMatch = s.name ? s.name.toLowerCase().includes(textQuery) : false;
    const emailMatch = s.email ? s.email.toLowerCase().includes(textQuery) : false;
    
    const phoneClean = s.phone ? String(s.phone).replace(/\D/g, "") : "";
    const phoneMatch = s.phone ? s.phone.includes(textQuery) || (cleanDigitsQuery && phoneClean.includes(cleanDigitsQuery)) : false;

    const matchesSearch = !textQuery || nameMatch || emailMatch || phoneMatch;

    const currentStatus = s.paymentStatus || "PAID";
    const matchesStatus = statusFilter === "ALL" || currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans text-slate-900 pb-12">
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-extrabold rounded-full border border-purple-100 uppercase">
            {isRu ? "Моя база" : "Менің Базам"}
          </span>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1.5">
            {isRu ? "База Учеников (CRM)" : "Оқушылар Базасы (CRM)"}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRu 
              ? "Все прикрепленные ученики, статусы оплаты и быстрая связь в WhatsApp." 
              : "Сізге тіркелген оқушылар тізімі, төлем статустары және WhatsApp арқылы жылдам байланыс."}
          </p>
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-600" />
          <div>
            <div className="text-[10px] font-black uppercase text-slate-400">{isRu ? "Всего учеников" : "Барлық оқушы"}</div>
            <div className="text-base font-black text-slate-900">{students.length}</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder={isRu ? "Поиск по имени, почте или телефону..." : "Аты, поштасы немесе телефоны бойынша..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${statusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {isRu ? "Все" : "Барлығы"} ({students.length})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${statusFilter === "PAID" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
            >
              {isRu ? "Оплачено" : "Төленді"}
            </button>
            <button
              onClick={() => setStatusFilter("INSTALLMENT")}
              className={`px-3 py-1.5 rounded-xl cursor-pointer transition ${statusFilter === "INSTALLMENT" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
            >
              {isRu ? "Рассрочка" : "Бөліп төлеу"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">{isRu ? "ФИО Ученика" : "Оқушы Аты-жөні"}</th>
                <th className="px-6 py-4">{isRu ? "Контакты" : "Байланыс"}</th>
                <th className="px-6 py-4">{isRu ? "Марафон / Группа" : "Марафон / Топ"}</th>
                <th className="px-6 py-4">{isRu ? "Статус оплаты" : "Төлем Статусы"}</th>
                <th className="px-6 py-4 text-right">{isRu ? "Быстрый WhatsApp" : "Жылдам WhatsApp"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    {isRu ? "Ученики не найдены." : "Оқушылар табылмады."}
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const phoneDigits = s.phone ? String(s.phone).replace(/\D/g, "") : "";
                  const payment = s.paymentStatus || "PAID";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{s.name || "—"}</td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="font-semibold text-slate-800">{s.email || "—"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.phone || "—"}</div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-lg font-extrabold text-[10px]">
                          <Layers size={12} />
                          {s.marathonTitle || s.marathon?.title || (isRu ? "Без марафона" : "Марафонсыз")}
                        </div>
                        {s.group?.name && (
                          <div className="text-[11px] text-slate-500 font-bold block">
                            {isRu ? "Группа: " : "Топ: "}{s.group.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-xl font-extrabold text-[10px] uppercase border ${
                            payment === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : payment === "INSTALLMENT"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {payment === "PAID"
                            ? (isRu ? "Оплачено" : "Төленді")
                            : payment === "INSTALLMENT"
                            ? (isRu ? "Рассрочка" : "Бөліп төлеу")
                            : "Промо / Бесплатно"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {phoneDigits ? (
                          <a
                            href={`https://wa.me/${phoneDigits}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-extrabold text-xs transition border border-emerald-200 cursor-pointer active:scale-95"
                          >
                            <MessageSquare size={14} /> WhatsApp
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}