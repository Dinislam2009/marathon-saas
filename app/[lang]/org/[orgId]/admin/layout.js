"use client";

import { useParams } from "next/navigation";
import { 
  LayoutGrid, 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Settings, 
  User, 
  BarChart3, 
  Layers, 
  BookOpen 
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminLayout({ children }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";
  
  // URL-ден [orgId]-ді аламыз
  const params = useParams();
  const orgId = params?.orgId || "";

  const navItems = [
    { 
      href: `/${lang}/org/${orgId}/admin`, 
      label: isRu ? "Марафоны" : "Марафондар", 
      icon: LayoutGrid 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/groups`, 
      label: isRu ? "Группы" : "Топтар", 
      icon: Layers 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/tasks`, 
      label: isRu ? "Задания" : "Тапсырмалар", 
      icon: BookOpen 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/statistics`, 
      label: isRu ? "Статистика" : "Статистика", 
      icon: BarChart3 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/curators`, 
      label: isRu ? "Кураторы" : "Кураторлар", 
      icon: ShieldCheck 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/managers`, 
      label: isRu ? "Менеджеры" : "Менеджерлер", 
      icon: UserCheck 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/students`, 
      label: isRu ? "Ученики" : "Оқушылар", 
      icon: Users 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/settings`, 
      label: isRu ? "Настройки" : "Баптаулар", 
      icon: Settings 
    },
    { 
      href: `/${lang}/org/${orgId}/admin/profile`, 
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