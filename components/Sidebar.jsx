"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams, useSearchParams } from "next/navigation";
import { 
  LayoutGrid, 
  Layers, 
  BookOpen, 
  BarChart2, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  Settings, 
  User 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();

  const lang = params?.lang || "ru";
  const orgId = searchParams.get("orgId") || "";
  const isRu = lang === "ru";

  const navItems = [
    {
      label: isRu ? "Марафоны" : "Марафондар",
      href: `/${lang}/org/admin${orgId ? `?orgId=${orgId}` : ""}`,
      icon: LayoutGrid,
    },
    {
      label: isRu ? "Группы" : "Топтар",
      href: `/${lang}/org/admin/groups${orgId ? `?orgId=${orgId}` : ""}`,
      icon: Layers,
    },
    {
      label: isRu ? "Задания" : "Тапсырмалар",
      href: `/${lang}/org/admin/tasks${orgId ? `?orgId=${orgId}` : ""}`,
      icon: BookOpen,
    },
    {
      label: isRu ? "Статистика" : "Статистика",
      href: `/${lang}/org/admin/analytics${orgId ? `?orgId=${orgId}` : ""}`,
      icon: BarChart2,
    },
    {
      label: isRu ? "Кураторы" : "Кураторлар",
      href: `/${lang}/org/admin/curators${orgId ? `?orgId=${orgId}` : ""}`,
      icon: ShieldCheck,
    },
    {
      label: isRu ? "Менеджеры" : "Менеджерлер", // 👈 Осы жаңа Менеджерлер бөлімі қосылды!
      href: `/${lang}/org/admin/managers${orgId ? `?orgId=${orgId}` : ""}`,
      icon: UserCheck,
    },
    {
      label: isRu ? "Ученики" : "Оқушылар",
      href: `/${lang}/org/admin/students${orgId ? `?orgId=${orgId}` : ""}`,
      icon: Users,
    },
    {
      label: isRu ? "Настройки" : "Баптаулар",
      href: `/${lang}/org/admin/settings${orgId ? `?orgId=${orgId}` : ""}`,
      icon: Settings,
    },
    {
      label: isRu ? "Профиль" : "Профиль",
      href: `/${lang}/org/admin/profile${orgId ? `?orgId=${orgId}` : ""}`,
      icon: User,
    },
  ];

  return (
    <aside className="w-64 bg-white min-h-screen p-6 flex flex-col justify-between font-sans border-r border-slate-100">
      <div className="space-y-8">
        {/* LOGO & BADGE */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-purple-600 tracking-tight">
              {isRu ? "Кабинет организатора" : "Уйымдастырушы кабинети"}
            </h1>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black rounded-md border border-purple-100 uppercase">
              {lang.toUpperCase()}
            </span>
          </div>
          <p className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mt-1">
            Организатор
          </p>
        </div>

        {/* NAV LINKS */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const currentBasePath = pathname.split("?")[0];
            const targetBasePath = item.href.split("?")[0];
            const isActive = currentBasePath === targetBasePath;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-extrabold transition ${
                  isActive
                    ? "bg-purple-50 text-purple-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} className={isActive ? "text-purple-600" : "text-slate-400"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}