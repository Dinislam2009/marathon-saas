"use client";

import { use, useEffect, useState } from "react";
import * as actions from "@/app/actions";
import { Users, CheckCircle, Flame, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function CuratorStatisticsPage({ params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  const [marathon, setMarathon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        let currentUserId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;
        if (!currentUserId && typeof window !== "undefined") {
          const userObj = JSON.parse(localStorage.getItem("currentUser") || "{}");
          currentUserId = userObj?.id;
        }

        const fn = actions.getcuratorMarathons || actions.getcuratorMarathonsAction;
        if (typeof fn === "function") {
          const marathons = await fn(currentUserId, orgId);
          if (marathons && marathons.length > 0) {
            setMarathon(marathons[0]);
          }
        }
      } catch (err) {
        console.error("Load curator statistics error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [orgId]);

  if (loading) {
    return <LoadingState />;
  }

  if (!marathon) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans text-xs font-bold">
        {isRu ? "Активный марафон не найден." : "Белсенді марафон табылмады."}
      </div>
    );
  }

  const studentCount = marathon.students?.length || 0;

  return (
    <div className="p-8 max-w-6xl space-y-8 font-sans text-slate-900 pb-12">
      <div>
        <h1 className="font-display text-2xl font-black text-slate-900">
          {marathon.title} — {isRu ? "Статистика" : "Статистика"}
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          {isRu ? "Длительность марафона: " : "Марафон ұзақтығы: "}
          {marathon.durationDays || 21} {isRu ? "дней" : "күн"}
        </p>
      </div>

      {/* Метрика карточкалары */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-700">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{studentCount}</div>
            <div className="text-xs text-slate-500 font-bold">
              {isRu ? "Кол-во учеников" : "Оқушылар саны"}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">0%</div>
            <div className="text-xs text-slate-500 font-bold">
              {isRu ? "Средний прогресс" : "Орташа прогресс"}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Flame size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">0</div>
            <div className="text-xs text-slate-500 font-bold">
              {isRu ? "Выполнено заданий" : "Орындалған тапсырмалар"}
            </div>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Clock size={22} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">0</div>
            <div className="text-xs text-slate-500 font-bold">
              {isRu ? "Ожидают проверки" : "Тексеруді күтуде"}
            </div>
          </div>
        </div>
      </div>

      {/* Оқушылар тізімі бөлімі */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          {isRu ? "Ученики марафона" : "Марафон оқушылары"}
        </h2>
        {studentCount === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400 font-medium">
            {isRu ? "В этом марафоне пока нет учеников." : "Бұл марафонда әлі оқушылар жоқ."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {marathon.students.map((student) => (
              <div key={student.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{student.email || "—"}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold">
                  {student.points || 0} {isRu ? "баллов" : "балл"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}