"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const THEME = {
  dusk: {
    aside: "bg-dusk text-white border-r border-white/5",
    link: "text-white/60 hover:text-white hover:bg-white/5",
    linkActive: "bg-white/10 text-white font-bold",
    eyebrow: "text-white/40",
  },
  ink: {
    aside: "bg-white border-r border-mist-light/60 text-ink",
    link: "text-mist hover:text-ink hover:bg-paper-dim",
    linkActive: "bg-horizon/10 text-horizon-dark font-bold",
    eyebrow: "text-mist",
  },
  paper: {
    aside: "bg-paper-dim/60 border-r border-mist-light/60 text-ink",
    link: "text-mist hover:text-ink hover:bg-white",
    linkActive: "bg-white text-horizon-dark shadow-sm font-bold",
    eyebrow: "text-mist",
  },
};

export default function DashboardShell({
  theme = "ink",
  eyebrow,
  title,
  navItems = [],
  headerRight,
  children,
}) {
  const pathname = usePathname();
  const t = THEME[theme] || THEME.ink;

  return (
    <div className="min-h-screen flex bg-paper">
      
      {/* 💻 КОМПЬЮТЕРЛІК САЙДБАР */}
      <aside
        className={cn(
          "hidden md:flex w-64 shrink-0 flex-col py-6 px-4 gap-8 sticky top-0 h-screen",
          t.aside
        )}
      >
        {/* Шапка / Логотип & Тақырып */}
        <div className="px-3">
          {/* 1. LOOPIT Логотипі (Сілтемесімен) */}
          <a
            href="https://marathon-saas.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block group"
          >
            <h1 className="font-display font-extrabold text-xl text-purple-600 tracking-tight leading-none group-hover:text-purple-700 transition-colors">
              {title || "LOOPIT"}
            </h1>
          </a>

          {/* 2. Кабинет ученика (Төменге түсті) */}
          {eyebrow && (
            <p className={cn("text-[11px] font-bold uppercase tracking-wider mt-1.5", t.eyebrow)}>
              {eyebrow}
            </p>
          )}
        </div>

        {/* Навигациялық пункттер */}
        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-150",
                  active ? t.linkActive : t.link
                )}
              >
                {Icon && <Icon size={20} className="shrink-0" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 📱 / 💻 НЕГІЗГІ КОНТЕНТ АЙМАҒЫ */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {headerRight && (
          <header className="flex justify-end items-center gap-3 px-4 sm:px-8 py-4 border-b border-mist-light/60 bg-white/80 backdrop-blur sticky top-0 z-10">
            {headerRight}
          </header>
        )}
        
        {/* ТҮЗЕТІЛДІ: max-w-6xl және mx-auto алып тасталды, енді экран толық толады */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}