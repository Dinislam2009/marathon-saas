"use client";

import { Home, BookOpen, Users, BarChart3, User, ClipboardList } from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function CuratorLayout({ children }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const navItems = [
    { 
      href: `/${lang}/org/curator`, 
      label: isRu ? "Главная" : "Басты бет", 
      icon: Home 
    },
    { 
      href: `/${lang}/org/curator/marathons`, 
      label: isRu ? "Марафоны" : "Марафондар", 
      icon: BookOpen 
    },
    { 
      href: `/${lang}/org/curator/submissions`, 
      label: isRu ? "Отчёты" : "Есептер", 
      icon: ClipboardList 
    },
    { 
      href: `/${lang}/org/curator/statistics`, 
      label: isRu ? "Статистика" : "Статистика", 
      icon: BarChart3 
    },
    { 
      href: `/${lang}/org/curator/students`, 
      label: isRu ? "Мои студенты" : "Оқушыларым", 
      icon: Users 
    },
    { 
      href: `/${lang}/org/curator/profile`, 
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