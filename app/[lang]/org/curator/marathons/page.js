"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, ChevronRight, Loader2 } from "lucide-react";
import * as actions from "@/app/actions";
import { useLanguage } from "@/context/LanguageContext";
import LoadingState from "@/components/LoadingState";

export default function curatorMarathonsPage() {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await actions.getcuratorMarathonsAction();
        setMarathons(res || []);
      } catch (err) {
        console.error("Load curator marathons error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
  return <LoadingState />;
}

  return (
    <div className="space-y-6 w-full pb-10 font-sans text-slate-900">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          {isRu ? "Мои марафоны" : "Менің Марафондарым"}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isRu
            ? "Закреплённые за вами марафоны и их расписание уроков"
            : "Сізге куратор ретінде бекітілген марафондар мен олардың сабақ кестесі"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marathons.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white border border-slate-100 rounded-3xl text-xs text-slate-400">
            {isRu ? "За вами пока не закреплён ни один марафон." : "Сізге әлі ешқандай марафон бекітілмеген."}
          </div>
        ) : (
          marathons.map((m) => (
            <Link
              key={m.id}
              href={`/${lang}/org/curator/marathons/${m.id}`}
              className="p-5 bg-white border border-slate-200/80 hover:border-purple-300 rounded-3xl shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                    {m.durationDays || 21} {isRu ? "Дней" : "Күндік"}
                  </span>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-purple-600 transition-colors" />
                </div>
                <h2 className="font-extrabold text-slate-900 text-base group-hover:text-purple-700 transition-colors">
                  {m.title}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 border-t border-slate-100 pt-3">
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-purple-600" />
                  {m._count?.students || 0} {isRu ? "учеников" : "оқушы"}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} className="text-blue-600" />
                  {m._count?.tasks || 0} {isRu ? "заданий" : "тапсырма"}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}