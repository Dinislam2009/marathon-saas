"use client";

import React from "react";
import { User, Mail, Phone, Users, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CuratorProfileClient({ initialData = {} }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  const curator = initialData?.curator || {};
  const metrics = initialData?.metrics || {};
  const fullName = curator?.name || [curator?.user?.firstName, curator?.user?.lastName].filter(Boolean).join(" ");

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {fullName || (isRu ? "Профиль куратора" : "Куратор профилі")}
            </h1>
            <p className="text-sm text-gray-500">
              {isRu ? "Профиль и статистика" : "Профиль және статистика"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-semibold text-gray-800 break-all">{curator?.email || curator?.user?.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-400">Телефон</p>
              <p className="text-sm font-semibold text-gray-800">{curator?.phone || curator?.user?.phone || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-400">{isRu ? "Ученики" : "Оқушылар"}</p>
              <p className="text-2xl font-extrabold text-gray-900">{Number(metrics?.studentCount || 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-xs text-gray-400">{isRu ? "Проверено" : "Тексерілген"}</p>
              <p className="text-2xl font-extrabold text-gray-900">{Number(metrics?.checkedSubmissionsCount || 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
