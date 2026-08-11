"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

const THEME = {
  dusk: {
    aside: "bg-dusk text-white border-r border-white/5",
    link: "text-white/70 hover:text-white hover:bg-white/5",
    linkActive: "bg-white/10 text-white font-bold shadow-xs",
    eyebrow: "text-white/40",
  },
  ink: {
    aside: "bg-white border-r border-mist-light/60 text-ink",
    link: "text-mist hover:text-ink hover:bg-paper-dim",
    linkActive: "bg-purple-50 text-purple-700 font-bold shadow-xs",
    eyebrow: "text-mist",
  },
  paper: {
    aside: "bg-paper-dim/60 border-r border-mist-light/60 text-ink",
    link: "text-mist hover:text-ink hover:bg-white",
    linkActive: "bg-white text-purple-700 shadow-sm font-bold",
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
  const { lang, setLang } = useLanguage();
  const isRu = lang === "ru";
  const t = THEME[theme] || THEME.ink;

  return (
    <div className="min-h-screen flex bg-paper font-sans text-slate-900">
      
      {/* 💻 КОМПЬЮТЕРЛІК САЙДБАР */}
      <aside
        className={cn(
          "hidden md:flex w-72 shrink-0 flex-col py-7 px-5 gap-7 sticky top-0 h-screen",
          t.aside
        )}
      >
        {/* Шапка / Логотип & Тақырып */}
        <div className="px-2 flex items-center justify-between">
          <div>
            <a
              href="https://marathon-saas.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block group"
            >
              <h1 className="font-display font-black text-2xl text-purple-600 tracking-tight leading-none group-hover:text-purple-700 transition-colors">
                {title || "LOOPIT"}
              </h1>
            </a>

            {eyebrow && (
              <p className={cn("text-xs font-extrabold uppercase tracking-wider mt-2", t.eyebrow)}>
                {eyebrow}
              </p>
            )}
          </div>

          {/* 🌐 Language Toggle */}
          <button
            onClick={() => setLang(isRu ? "kk" : "ru")}
            className="px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-xs font-extrabold text-purple-700 transition-colors border border-purple-200 cursor-pointer"
          >
            {isRu ? "KZ" : "RU"}
          </button>
        </div>

        {/* Навигациялық пункттер */}
        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-150",
                  active ? t.linkActive : t.link
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {Icon && (
                    <Icon
                      size={22}
                      className={cn(
                        "shrink-0 transition-colors",
                        active ? "text-purple-600" : item.color || "text-gray-400"
                      )}
                    />
                  )}
                  <span className="truncate text-sm">{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-amber-100 text-amber-700 rounded-lg border border-amber-200 shrink-0">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* НЕГІЗГІ КОНТЕНТ АЙМАҒЫ */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <header className="flex justify-between items-center gap-3 px-4 sm:px-8 py-4 border-b border-mist-light/60 bg-white/80 backdrop-blur sticky top-0 z-10">
          <div className="md:hidden flex items-center gap-2">
            <span className="font-display font-black text-xl text-purple-600">LOOPIT</span>
            <button
              onClick={() => setLang(isRu ? "kk" : "ru")}
              className="px-2 py-0.5 rounded-lg bg-purple-50 text-xs font-bold text-purple-700 border border-purple-200"
            >
              {isRu ? "KZ" : "RU"}
            </button>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {headerRight}
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}