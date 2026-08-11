"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { Users, Search, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function AdminStudentsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const { orgId } = use(params);

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  // Деректерді жүктеу
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Белсенді марафондарды оқу
      const activeMarathons = await actions.getMarathonsByOrgId(orgId);
      const validMarathonIds = new Set((activeMarathons || []).map((m) => m.id));

      // 2. Оқушылар тізімін оқу
      const studentsList = await actions.getStudentsByOrgId(orgId);
      setStudents(studentsList || []);

      // 3. Топтарды алу және өшірілген марафондардың топтарын сүзіп тастау
      const res = await fetch(`/api/org/groups?orgId=${orgId}`);
      const json = await res.json();

      if (json.ok) {
        const activeGroups = (json.groups || []).filter((g) =>
          g.marathonId ? validMarathonIds.has(g.marathonId) : true
        );
        setGroups(activeGroups);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Оқушыны топқа бекіту / ауыстыру
  const handleAssignGroup = async (studentId, groupId) => {
    try {
      setAssigningId(studentId);
      const res = await actions.assignStudentToGroupAction(studentId, groupId);
      if (res?.ok) {
        // Оптимистік түрде жергілікті стейтті бірден жаңарту
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId ? { ...s, groupId: groupId || null } : s
          )
        );
        await fetchData();
      } else {
        alert(
          (isRu ? "Ошибка: " : "Қате: ") +
            (res?.error || (isRu ? "Не удалось привязать к группе" : "Топқа бекіту мүмкін болмады"))
        );
      }
    } catch (err) {
      console.error("Assign group error:", err);
    } finally {
      setAssigningId(null);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  // ⚡ ІЗДЕУ ФИЛЬТРІ (Аты, Email немесе Номер бойынша)
  const cleanQuery = searchQuery.trim().toLowerCase().replace(/\D/g, "");
  const textQuery = searchQuery.trim().toLowerCase();

  const filteredStudents = students.filter((s) => {
    if (!textQuery) return true;

    const nameMatch = s.name?.toLowerCase().includes(textQuery);
    const emailMatch = s.email?.toLowerCase().includes(textQuery);
    
    const rawPhoneDigits = s.phone ? String(s.phone).replace(/\D/g, "") : "";
    const phoneMatch = s.phone?.toLowerCase().includes(textQuery) || (cleanQuery && rawPhoneDigits.includes(cleanQuery));

    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="space-y-6 w-full pb-12 font-sans text-slate-900">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ІЗДЕУ */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRu ? "Все участники" : "Барлық Қатысушылар"}
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            {isRu
              ? "Участники и группы всех марафонов организации в одном месте."
              : "Ұйымның барлық марафондарының қатысушылары мен топтары бір жерде."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder={isRu ? "Имя, Email или Номер телефона..." : "Аты, Email немесе Телефон нөмірі..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-purple-600 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 2. ИНФО КАРТОЧКА */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
              {isRu ? "Всего участников" : "Барлық Қатысушы"}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{students.length}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
            <Users size={22} />
          </div>
        </div>
      </div>

      {/* 3. ОҚУШЫЛАР КЕСТЕСІ */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">{isRu ? "ФИО" : "Аты-жөні"}</th>
                <th className="px-6 py-4">{isRu ? "Email / Телефон" : "Email / Телефон"}</th>
                <th className="px-6 py-4">{isRu ? "Марафон" : "Марафон"}</th>
                <th className="px-6 py-4">{isRu ? "Привязать к группе" : "Топқа бекіту"}</th>
                <th className="px-6 py-4 text-right">{isRu ? "Баллы" : "Баллдар"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-semibold">
                    {isRu
                      ? "По результатам поиска участники не найдены."
                      : "Іздеу нәтижесі бойынша қатысушылар табылмады."}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  // Оқушының марафонына сай келетін топтарды сүзіп алу
                  const availableGroups = groups.filter(
                    (g) => !student.marathonId || g.marathonId === student.marathonId
                  );

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{student.name}</td>
                      <td className="px-6 py-4 space-y-0.5">
                        <div className="font-semibold text-slate-800">{student.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{student.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-xl font-extrabold text-[11px]">
                          {student.marathonTitle || (isRu ? "Без марафона" : "Марафонсыз")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={student.groupId || ""}
                            disabled={assigningId === student.id}
                            onChange={(e) => handleAssignGroup(student.id, e.target.value)}
                            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-purple-600 cursor-pointer disabled:opacity-50"
                          >
                            <option value="">{isRu ? "— Без группы —" : "— Топсыз —"}</option>
                            {availableGroups.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </select>
                          {assigningId === student.id && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-purple-700 text-sm">
                        {student.points || 0} {isRu ? "б" : "б"}
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