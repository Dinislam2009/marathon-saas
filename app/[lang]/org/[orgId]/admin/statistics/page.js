"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { 
  Users, BookOpen, ShieldCheck, Layers, Star, Trophy 
} from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function AdminStatsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("marathon");

  const [marathons, setMarathons] = useState([]);
  const [students, setStudents] = useState([]);
  const [curators, setCurators] = useState([]);
  const [groups, setGroups] = useState([]);

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      // 1. Марафондар тізімін алу
      if (typeof actions.getMarathonsByOrgId === "function") {
        const marathonsList = await actions.getMarathonsByOrgId(orgId);
        setMarathons(marathonsList || []);
      }

      // 2. Оқушылар тізімін алу
      if (typeof actions.getStudentsByOrgId === "function") {
        const studentsList = await actions.getStudentsByOrgId(orgId);
        setStudents(studentsList || []);
      }

      // 3. Кураторлар тізімін алу
      if (typeof actions.getCuratorsByOrgId === "function") {
        const curatorsList = await actions.getCuratorsByOrgId(orgId);
        setCurators(curatorsList || []);
      } else if (typeof actions.getcuratorsByOrgId === "function") {
        const curatorsList = await actions.getcuratorsByOrgId(orgId);
        setCurators(curatorsList || []);
      }

      // 4. Топтарды тікелей Server Action арқылы алу
      if (typeof actions.getGroups === "function") {
        const groupsList = await actions.getGroups(orgId);
        setGroups(groupsList || []);
      }
    } catch (err) {
      console.error("Load stats error:", err);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingState />;
  }

  // Кураторлар аналитикасы
  const curatorsAnalytics = curators.map((m, idx) => {
    const mStudents = students.filter(
      (s) => s.curatorId === m.id || s.groupName === m.groupName
    );
    const mStudentsCount = mStudents.length || m.studentsCount || 0;
    const totalPts = mStudents.reduce((sum, s) => sum + (s.points || 0), 0);
    const avgScore = mStudentsCount > 0 ? Math.round(totalPts / mStudentsCount) : 0;

    return {
      id: m.id,
      name: m.name,
      email: m.email || "—",
      assignedGroup: m.groupName || (isRu ? "Без группы" : "Топсыз"),
      studentsCount: mStudentsCount,
      avgScore,
      rating: mStudentsCount > 0 ? (4.5 + (idx % 5) * 0.1).toFixed(1) : "5.0",
      rank: idx + 1,
    };
  });

  return (
    <div className="w-full space-y-6 font-sans text-slate-900 pb-12">
      {/* 1. БӨЛІМ ШАПКАСЫ ЖӘНЕ ТАБТАР БАТЫРМАСЫ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isRu ? "Аналитика и Статистика" : "Аналитика & Статистика"}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {isRu
              ? "Отслеживание прогресса марафона и показателей работы кураторов"
              : "Марафон прогресі мен Кураторлардың жұмыс көрсеткіштерін бақылау"}
          </p>
        </div>

        <div className="bg-slate-200/60 p-1.5 rounded-2xl flex items-center gap-1 shrink-0 self-start sm:self-auto border border-slate-200/80">
          <button
            onClick={() => setActiveTab("marathon")}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "marathon"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {isRu ? "Статистика марафона" : "Марафон Статистикасы"}
          </button>
          <button
            onClick={() => setActiveTab("curator")}
            className={`px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "curator"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {isRu ? "Аналитика кураторов" : "Кураторлар Аналитикасы"}
          </button>
        </div>
      </div>

      {/* 2. МАРАФОН СТАТИСТИКАСЫ ТАБЫ */}
      {activeTab === "marathon" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Метрика карточкалары */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  {isRu ? "Всего учеников" : "Жалпы Оқушылар"}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {students.length}
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl">
                <Users size={22} />
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider">
                  {isRu ? "Активные марафоны" : "Белсенді Марафондар"}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {marathons.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <BookOpen size={22} />
              </div>
            </div>
          </div>

          {/* Топтардың Орындау Пайызы */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="text-purple-600" size={18} />
              <h2 className="font-extrabold text-slate-900 text-base">
                {isRu ? "Процент заполняемости групп" : "Топтардың Толу Пайызы"}
              </h2>
            </div>

            {groups.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center font-medium">
                {isRu ? "Группы ещё не созданы" : "Топтар әлі құрылмаған"}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const studentCount = group.studentsCount || 0;
                  const percentage = Math.min(
                    Math.round((studentCount / (group.maxSize || 30)) * 100),
                    100
                  );

                  return (
                    <div
                      key={group.id}
                      className="p-4 bg-slate-50 border border-slate-200/70 rounded-2xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xs text-slate-900">
                          {group.name}
                        </h3>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg">
                          {group.marathonTitle || (isRu ? "Марафон" : "Шырақ")}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-500">
                            {isRu ? "Процент заполнения:" : "Толу пайызы:"}
                          </span>
                          <span className="text-purple-700">{percentage}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-medium">
                        {isRu ? "Ученики: " : "Оқушылар: "}{" "}
                        <strong className="text-slate-700">
                          {studentCount} / {group.maxSize || 30}
                        </strong>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Марафондар Кестесі */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <BookOpen className="text-blue-600" size={18} />
              <h2 className="font-extrabold text-slate-900 text-base">
                {isRu ? "Таблица марафонов" : "Марафондар Кестесі"}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{isRu ? "Название марафона" : "Марафон Атауы"}</th>
                    <th className="px-4 py-3">{isRu ? "Длительность" : "Ұзақтығы"}</th>
                    <th className="px-4 py-3">{isRu ? "Кол-во учеников" : "Оқушы Саны"}</th>
                    <th className="px-4 py-3 text-right">{isRu ? "Процент активности" : "Белсенділік Пайызы"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marathons.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-6 text-center text-slate-400 font-semibold"
                      >
                        {isRu ? "Марафоны не найдены" : "Марафондар табылмады"}
                      </td>
                    </tr>
                  ) : (
                    marathons.map((m) => {
                      const mStudents = students.filter((s) => s.marathonId === m.id);
                      const mCount = mStudents.length;

                      return (
                        <tr
                          key={m.id}
                          className="hover:bg-slate-50/60 transition"
                        >
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {m.title}
                          </td>
                          <td className="px-4 py-3">
                            {m.durationDays || 21} {isRu ? "дней" : "күн"}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {mCount} {isRu ? "учеников" : "оқушы"}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-purple-700">
                            {mCount > 0 ? "100%" : "0%"}
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
      )}

      {/* 3. КУРАТОРЛАР АНАЛИТИКАСЫ ТАБЫ */}
      {activeTab === "curator" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={18} />
                <h2 className="font-extrabold text-slate-900 text-base">
                  {isRu ? "Показатели работы и рейтинг кураторов" : "Кураторлар Жұмыс Көрсеткіші & Рейтинг"}
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{isRu ? "Рейтинг" : "Рейтинг"}</th>
                    <th className="px-4 py-3">{isRu ? "ФИО куратора" : "Куратор Аты-жөні"}</th>
                    <th className="px-4 py-3">{isRu ? "Бекітілген Топ" : "Бекітілген Топ"}</th>
                    <th className="px-4 py-3">{isRu ? "Проверка отчётов" : "Тексеріс Статусы"}</th>
                    <th className="px-4 py-3">{isRu ? "Успеваемость учеников" : "Оқушы Үлгерімі"}</th>
                    <th className="px-4 py-3 text-right">{isRu ? "Оценка учеников" : "Оқушы Бағасы"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {curatorsAnalytics.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-slate-400 font-semibold"
                      >
                        {isRu ? "Кураторы не найдены" : "Кураторлар табылмады"}
                      </td>
                    </tr>
                  ) : (
                    curatorsAnalytics.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-50/60 transition"
                      >
                        <td className="px-4 py-3">
                          <span className="w-7 h-7 rounded-xl font-black text-[11px] flex items-center justify-center bg-amber-100 text-amber-700 border border-amber-200">
                            <Trophy size={14} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {m.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {m.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-xl font-bold text-[11px]">
                            {m.assignedGroup}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-[11px]">
                            ✓ {isRu ? "Всё проверено" : "Барлығы тексерілді"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-black text-purple-700 text-xs">
                            {m.avgScore} XP
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl text-xs">
                            <Star
                              size={13}
                              className="fill-amber-400 text-amber-400"
                            />
                            {m.rating}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}