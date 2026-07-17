"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  MessageCircle,
  User,
  X,
  Menu as MenuIcon,
  Users,
  BookOpen,
  Hourglass,
  Target,
  Trophy,
  LayoutGrid,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileTabBar({ orgId, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const base = `/org/${orgId}/student`;

  const navItems = [
    { href: base, label: "Басты бет", icon: Home },
    { href: `${base}/progress`, label: "Күнтізбе", icon: Calendar },
  ];
  const navItemsRight = [
    { href: `${base}/chat`, label: "Чат", icon: MessageCircle },
    { href: `${base}/profile`, label: "Профиль", icon: User },
  ];

  const menuItems = [
    { href: `${base}/groups`, label: "Топ", desc: "Менің тобым", icon: Users },
    { href: `${base}/materials`, label: "Материалдар", desc: "Пайдалы файлдар", icon: BookOpen },
    { href: `${base}/countdown`, label: "Кері санақ", desc: "Дедлайнға дейін", icon: Hourglass },
    { href: `${base}/habits`, label: "Әдеттер", desc: "Әдет трекері", icon: Target },
    { href: `${base}/leaderboard`, label: "Рейтинг", desc: "Топ көшбасшылар", icon: Trophy },
    { href: `${base}/matrix`, label: "Матрица", desc: "Эйзенхауэр приоритеттер", icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <main className="flex-1 px-4 sm:px-6 pt-6 pb-32 max-w-lg mx-auto w-full">{children}</main>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40"
        />
      )}

      <div
        className={cn(
          "fixed bottom-0 inset-x-0 bg-white rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border-t border-mist-light z-50 transition-transform duration-300 pb-28 max-w-lg mx-auto",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <button onClick={() => setOpen(false)} className="w-full flex justify-center py-4">
          <span className="w-12 h-1.5 rounded-full bg-mist-light" />
        </button>

        <div className="px-6 flex flex-col gap-5">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-mist" />
            <input
              placeholder="Платформадан іздеу..."
              className="w-full pl-11 pr-4 py-3 bg-paper-dim border border-mist-light rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-horizon/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {menuItems.map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 p-4 bg-paper-dim hover:bg-horizon/10 border border-mist-light rounded-2xl transition text-left"
              >
                <Icon size={20} className="text-horizon-dark shrink-0" />
                <div>
                  <span className="block text-sm font-bold text-ink leading-tight">{label}</span>
                  <span className="block text-[11px] text-mist mt-0.5">{desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 inset-x-0 px-4 z-50 max-w-lg mx-auto">
        <div className="bg-white/95 backdrop-blur-md py-3 px-4 rounded-[32px] shadow-[0_12px_40px_rgba(124,58,237,0.15)] border border-white/40 flex justify-between items-center">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1",
                  active ? "text-horizon-dark" : "text-mist hover:text-ink"
                )}
              >
                <Icon size={22} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-horizon to-horizon-dark rounded-full text-white shadow-lg shadow-horizon/30 hover:scale-105 active:scale-95 transition-all -mt-6 shrink-0"
          >
            {open ? <X size={24} /> : <MenuIcon size={24} />}
          </button>

          {navItemsRight.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1",
                  active ? "text-horizon-dark" : "text-mist hover:text-ink"
                )}
              >
                <Icon size={22} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
