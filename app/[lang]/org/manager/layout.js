"use client";

import { use } from "react";
import { 
  BarChart3, 
  UserPlus, 
  Users, 
  Inbox, 
  Link as LinkIcon 
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function ManagerLayout({ children, params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  // Next.js 15 App Router асинхронды params ағыны
  const resolvedParams = use(params);

  const navItems = [
    { 
      href: `/${lang}/org/manager`, 
      label: isRu ? "Дашборд & KPI" : "Дашборд & KPI", 
      icon: BarChart3 
    },
    { 
      href: `/${lang}/org/manager/add-student`, 
      label: isRu ? "Быстрый ввод" : "Жылдам тіркеу", 
      icon: UserPlus 
    },
    { 
      href: `/${lang}/org/manager/students`, 
      label: isRu ? "Моя база (CRM)" : "Менің оқушыларым", 
      icon: Users 
    },
    { 
      href: `/${lang}/org/manager/unassigned`, 
      label: isRu ? "Нераспределенные" : "Бос оқушылар", 
      icon: Inbox 
    },
    { 
      href: `/${lang}/org/manager/ref-links`, 
      label: isRu ? "Реф. ссылки" : "Реф. сілтемелер", 
      icon: LinkIcon 
    },
  ];

  return (
    <DashboardShell 
      theme="ink" 
      eyebrow={isRu ? "Менеджер по продажам" : "Сату Менеджері"} 
      title={isRu ? "Кабинет Менеджера" : "Менеджер Кабинеті"} 
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}