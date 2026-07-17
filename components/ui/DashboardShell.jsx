"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const THEME = {
  dusk: {
    aside: "bg-dusk text-white",
    link: "text-white/60 hover:text-white hover:bg-white/5",
    linkActive: "bg-white/10 text-white",
    eyebrow: "text-white/40",
  },
  ink: {
    aside: "bg-white border-r border-mist-light text-ink",
    link: "text-mist hover:text-ink hover:bg-paper-dim",
    linkActive: "bg-horizon/10 text-horizon-dark",
    eyebrow: "text-mist",
  },
  paper: {
    aside: "bg-paper-dim/60 border-r border-mist-light text-ink",
    link: "text-mist hover:text-ink hover:bg-white",
    linkActive: "bg-white text-horizon-dark shadow-sm",
    eyebrow: "text-mist",
  },
};

export default function DashboardShell({
  theme = "ink",
  eyebrow,
  title,
  navItems,
  headerRight,
  children,
}) {
  const pathname = usePathname();
  const t = THEME[theme];

  return (
    <div className="min-h-screen flex bg-paper">
      <aside
        className={cn(
          "w-16 sm:w-60 shrink-0 flex flex-col py-5 px-2 sm:px-4 gap-6",
          t.aside
        )}
      >
        <div className="px-2">
          <p className={cn("hidden sm:block text-xs uppercase tracking-wider", t.eyebrow)}>
            {eyebrow}
          </p>
          <h1 className="hidden sm:block font-display font-semibold text-lg mt-0.5 leading-tight">
            {title}
          </h1>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? t.linkActive : t.link
                )}
              >
                <Icon size={18} className="shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        {headerRight && (
          <div className="flex justify-end items-center gap-3 px-4 sm:px-8 py-4 border-b border-mist-light bg-white/60 backdrop-blur">
            {headerRight}
          </div>
        )}
        <main className="p-4 sm:p-8 max-w-5xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
