"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useData } from "@/context/DataContext";
import { STUDENT_STATUS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Card from "@/components/Card";
import Badge from "@/components/Badge";
import LoadingState from "@/components/LoadingState";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";

export default function MarathonPeoplePage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const marathonId = resolvedParams?.marathonId;
  const orgId = resolvedParams?.orgId; // 👈 orgId алынды

  const { ready, tick } = useData();

  const [marathon, setMarathon] = useState(null);
  const [students, setStudents] = useState([]);
  const [curators, setCurators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("student");

  useEffect(() => {
    async function loadData() {
      if (!marathonId) return;
      try {
        setLoading(true);

        // 1. Марафон ақпаратын жүктеу
        const getMarathonFn = actions.getMarathonById || actions.getmarathonById;
        if (typeof getMarathonFn === "function") {
          const m = await getMarathonFn(marathonId);
          setMarathon(m);
        }

        // 2. Оқушыларды жүктеу
        const getStudentsFn = actions.getStudentsByMarathonId || actions.getstudentsByMarathonId;
        if (typeof getStudentsFn === "function") {
          const st = await getStudentsFn(marathonId);
          setStudents(st || []);
        }

        // 3. Кураторларды жүктеу (Бас/Кіші әріптерге қауіпсіз тексеру)
        const getCuratorsFn = actions.getCuratorsByMarathonId || actions.getcuratorsByMarathonId;
        if (typeof getCuratorsFn === "function") {
          const mt = await getCuratorsFn(marathonId);
          setCurators(mt || []);
        }
      } catch (err) {
        console.error("Failed to load people data:", err);
      } finally {
        setLoading(false);
      }
    }

    if (ready) {
      loadData();
    }
  }, [ready, marathonId, tick]);

  if (!ready || loading) return <LoadingState />;

  // Маршрутты қатесіз құру
  const backUrl = orgId 
    ? `/${lang}/org/${orgId}/admin/marathons/${marathonId}`
    : `/${lang}/org/admin`;

  return (
    <div key={tick} className="flex flex-col gap-6 font-sans text-slate-900 pb-8">
      <div>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 w-fit mb-3 transition font-medium"
        >
          <ArrowLeft size={14} /> {marathon?.title || (isRu ? "Назад к марафону" : "Марафонға қайту")}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-display text-2xl font-black text-slate-900">
            {isRu ? "Участники марафона" : "Марафон қатысушылары"}
          </h1>
        </div>
      </div>

      {/* ТАБТАР */}
      <div className="inline-flex bg-slate-100 p-1 rounded-xl gap-1 w-fit">
        {[
          { 
            key: "student", 
            label: isRu ? `Ученики (${students.length})` : `Оқушылар (${students.length})` 
          },
          { 
            key: "curator", 
            label: isRu ? `Кураторы (${curators.length})` : `Кураторлар (${curators.length})` 
          },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer",
              tab === t.key
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-900"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ОҚУШЫЛАР НЕМЕСЕ КУРАТОРЛАР КЕСТЕСІ */}
      {tab === "student" ? (
        <Card padded={false} className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 tracking-wide bg-slate-50/50">
                <th className="px-5 py-3 font-bold">{isRu ? "Ученик" : "Оқушы"}</th>
                <th className="px-5 py-3 font-bold">{isRu ? "Куратор" : "Куратор"}</th>
                <th className="px-5 py-3 font-bold">{isRu ? "Баллы" : "Ұпай"}</th>
                <th className="px-5 py-3 font-bold">{isRu ? "Статус" : "Күй"}</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate-400 font-medium">
                    {isRu ? "Учеников пока нет." : "Әзірге оқушы жоқ."}
                  </td>
                </tr>
              )}
              {students.map((student, index) => (
                <tr
                  key={student.id || `student-${index}`}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{student.name || (isRu ? "Без имени" : "Аты жоқ")}</p>
                    <p className="text-slate-400 text-xs">{student.email || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-medium">
                    {student.curator?.name || student.curatorName || (isRu ? "Не назначен" : "Тағайындалмаған")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-900 font-bold">
                    {student.points || student.score || 0}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge
                      tone={
                        student.status === STUDENT_STATUS?.ACTIVE || student.status === "ACTIVE"
                          ? "steppe"
                          : "ember"
                      }
                    >
                      {student.status === STUDENT_STATUS?.ACTIVE || student.status === "ACTIVE"
                        ? (isRu ? "Активен" : "Белсенді")
                        : (isRu ? "Заблокирован" : "Бұғатталған")}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card padded={false} className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 tracking-wide bg-slate-50/50">
                <th className="px-5 py-3 font-bold">{isRu ? "Куратор" : "Куратор"}</th>
                <th className="px-5 py-3 font-bold">{isRu ? "Контакты" : "Байланыс"}</th>
                <th className="px-5 py-3 font-bold">{isRu ? "Кол-во учеников" : "Оқушы саны"}</th>
              </tr>
            </thead>
            <tbody>
              {curators.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate-400 font-medium">
                    {isRu ? "Кураторов пока нет." : "Әзірге куратор жоқ."}
                  </td>
                </tr>
              )}
              {curators.map((curator, index) => (
                <tr
                  key={curator.id || `curator-${index}`}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition"
                >
                  <td className="px-5 py-3.5 font-bold text-slate-900">
                    {curator.name || (isRu ? "Без имени" : "Аты жоқ")}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-medium">
                    {curator.phone || "—"} · {curator.email || "—"}
                  </td>
                  <td className="px-5 py-3.5 text-slate-900 font-bold">
                    {curator._count?.students || curator.studentsCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}