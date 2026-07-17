"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheck, LayoutDashboard, Flame, ArrowRight, RotateCcw, Users } from "lucide-react";
import * as db from "@/lib/data";
import { useData } from "@/context/DataContext";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import LoadingState from "@/components/ui/LoadingState";

export default function Home() {
  const { ready, resetDemoData } = useData();
  const [demoOrgId, setDemoOrgId] = useState(null);

  useEffect(() => {
    if (!ready) return;
    const org = db.getOrganizers()[0];
    setDemoOrgId(org?.id ?? null);
  }, [ready]);

  if (!ready) return <LoadingState />;

  const roles = [
    {
      href: "/super-admin",
      icon: ShieldCheck,
      title: "Super Admin",
      desc: "Барлық ұйымдастырушыларды қосу, жазылымдарын қадағалау және бұғаттау.",
    },
    {
      href: demoOrgId ? `/org/${demoOrgId}/admin` : "#",
      icon: LayoutDashboard,
      title: "Ұйымдастырушы кабинеті",
      desc: "Марафон құру, күнделікті тапсырмалар енгізу, оқушылардың жандарын бақылау.",
    },
    {
      href: demoOrgId ? `/org/${demoOrgId}/mentor` : "#",
      icon: Users,
      title: "Ментор кабинеті",
      desc: "Тек өзіңе тіркелген оқушыларды бақылау (оқшауланған топ).",
    },
    {
      href: demoOrgId ? `/org/${demoOrgId}/student` : "#",
      icon: Flame,
      title: "Оқушы кабинеті",
      desc: "Күнделікті жоспар, 21 күндік прогресс тор және рейтинг.",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full">
        <p className="text-xs uppercase tracking-wider text-mist mb-2">
          Phase 1 — демо кіру беті
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink mb-3 leading-tight">
          Марафон SaaS платформасы
        </h1>
        <p className="text-mist max-w-xl mb-10">
          Нақты авторизация Phase 2-де қосылады. Қазір рөлдердің қайсысын
          көргің келетінін таңда — деректер браузердің localStorage-інде
          сақталады.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {roles.map(({ href, icon: Icon, title, desc }) => (
            <Link key={title} href={href} className="group block h-full">
              <Card className="h-full flex flex-col gap-3 hover:border-horizon transition-colors">
                <div className="h-10 w-10 rounded-xl bg-horizon/10 flex items-center justify-center text-horizon-dark">
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-ink mb-1">{title}</h2>
                  <p className="text-sm text-mist leading-relaxed">{desc}</p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-horizon-dark">
                  Кіру <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Card>
            </Link>
          ))}
        </div>

        <Button variant="ghost" size="sm" onClick={resetDemoData} className="text-mist">
          <RotateCcw size={14} /> Демо деректерді бастапқы қалпына келтіру
        </Button>
      </div>
    </div>
  );
}
