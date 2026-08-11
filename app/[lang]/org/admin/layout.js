"use client";

import { use } from "react";
import { 
  LayoutGrid, 
  Users, 
  UserCheck, // 👈 Менеджер иконкасы
  ShieldCheck, 
  Settings, 
  User, 
  BarChart3, 
  Layers, 
  BookOpen 
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminLayout({ children, params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  const { orgId } = use(params);

  const navItems = [
    { 
      href: `/${lang}/org/admin`, 
      label: isRu ? "Марафоны" : "Марафондар", 
      icon: LayoutGrid 
    },
    { 
      href: `/${lang}/org/admin/groups`, 
      label: isRu ? "Группы" : "Топтар", 
      icon: Layers 
    },
    { 
      href: `/${lang}/org/admin/tasks`, 
      label: isRu ? "Задания" : "Тапсырмалар", 
      icon: BookOpen 
    },
    { 
      href: `/${lang}/org/admin/statistics`, 
      label: isRu ? "Статистика" : "Статистика", 
      icon: BarChart3 
    },
    { 
      href: `/${lang}/org/admin/curators`, 
      label: isRu ? "Кураторы" : "Кураторлар", 
      icon: ShieldCheck 
    },
    { 
      href: `/${lang}/org/admin/managers`, // 👈 ТУРА ОСЫ ЖЕРГЕ ҚОСЫЛДЫ
      label: isRu ? "Менеджеры" : "Менеджерлер", 
      icon: UserCheck 
    },
    { 
      href: `/${lang}/org/admin/students`, 
      label: isRu ? "Ученики" : "Оқушылар", 
      icon: Users 
    },
    { 
      href: `/${lang}/org/admin/settings`, 
      label: isRu ? "Настройки" : "Баптаулар", 
      icon: Settings 
    },
    { 
      href: `/${lang}/org/admin/profile`, 
      label: isRu ? "Профиль" : "Профиль", 
      icon: User 
    },
  ];

  return (
    <DashboardShell 
      theme="ink" 
      eyebrow={isRu ? "Организатор" : "Организатор"} 
      title={isRu ? "Кабинет организатора" : "Кабинет организатора"} 
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}