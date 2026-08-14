"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { LayoutDashboard, Building2, Zap, Megaphone, ArrowLeft, UserCheck, User } from "lucide-react";

export default function OwnerSidebar() {
  const pathname = usePathname();
  const params = useParams();
  
  const lang = params?.lang || "ru";
  const orgId = params?.orgId || "";

  // ⚡ Барлық сілтемелер жаңа /[lang]/org/[orgId]/owner құрылымына сай
  const navItems = [
    {
      label: "Метрикалар",
      href: `/${lang}/org/${orgId}/owner`,
      icon: LayoutDashboard,
    },
    {
      label: "Ұйымдар (B2B)",
      href: `/${lang}/org/${orgId}/owner/organizations`,
      icon: Building2,
    },
    {
      label: "Тарифтер & Лимиттер",
      href: `/${lang}/org/${orgId}/owner/subscriptions`,
      icon: Zap,
    },
    {
      label: "Хабарландырулар",
      href: `/${lang}/org/${orgId}/owner/broadcast`,
      icon: Megaphone,
    },
    {
      label: "Профиль",
      href: `/${lang}/org/${orgId}/owner/profile`,
      icon: User,
    }  
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 min-h-screen p-6 flex flex-col justify-between font-sans">
      <div className="space-y-8">
        {/* LOGO & BADGE */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-slate-900">Loopit</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-black text-[9px] rounded-md uppercase">
              admin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Super Admin Control Center</p>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* FOOTER ACTION */}
      <div className="pt-6 border-t border-slate-100">
        <Link
          href={orgId ? `/${lang}/org/${orgId}/admin` : `/${lang}/login`}
          className="flex items-center gap-2 text-xs font-extrabold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          Кабинетке қайту
        </Link>
      </div>
    </aside>
  );
}