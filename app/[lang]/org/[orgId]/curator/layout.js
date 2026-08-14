"use client";

import { useParams } from "next/navigation";
import { Home, BookOpen, Users, BarChart3, User, ClipboardList } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function CuratorLayout({ children }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  // ⚡ URL-ден динамикалық [orgId]-ді ұстап аламыз
  const params = useParams();
  const orgId = params?.orgId || "";

  const navItems = [
    { 
      href: `/${lang}/org/${orgId}/curator`, 
      label: isRu ? "Главная" : "Басты бет", 
      icon: Home 
    },
    { 
      href: `/${lang}/org/${orgId}/curator/marathons`, 
      label: isRu ? "Марафоны" : "Марафондар", 
      icon: BookOpen 
    },
    { 
      href: `/${lang}/org/${orgId}/curator/submissions`, 
      label: isRu ? "Отчёты" : "Есептер", 
      icon: ClipboardList 
    },
    { 
      href: `/${lang}/org/${orgId}/curator/statistics`, 
      label: isRu ? "Статистика" : "Статистика", 
      icon: BarChart3 
    },
    { 
      href: `/${lang}/org/${orgId}/curator/students`, 
      label: isRu ? "Мои студенты" : "Оқушыларым", 
      icon: Users 
    },
    { 
      href: `/${lang}/org/${orgId}/curator/profile`, 
      label: isRu ? "Профиль" : "Профиль", 
      icon: User 
    },
  ];

  return (
    <DashboardShell 
      theme="ink" 
      eyebrow={isRu ? "Куратор" : "Куратор"} 
      title={isRu ? "Кабинет куратора" : "Куратор кабинеті"} 
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}