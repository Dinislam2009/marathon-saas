"use client";

import { use, useMemo } from "react";
import DashboardShell from "@/components/DashboardShell";
import { 
  Home, 
  Calendar, 
  Users, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Trophy, 
  Grid, 
  MessageSquare, 
  User,
  CheckSquare
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function StudentLayout({ children, params }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId || "orgId";

  // Меню тізімі (Тілге сәйкес динамикалық түрде аударылады)
  const studentNavItems = useMemo(() => [
    { label: isRu ? "Главная" : "Басты бет", href: `/org/student`, icon: Home, color: "text-blue-500" },
    { label: isRu ? "Задания" : "Тапсырмалар", href: `/org/student/tasks`, icon: CheckSquare, color: "text-purple-600" },
    { label: isRu ? "Календарь" : "Күнтізбе", href: `/org/student/calendar`, icon: Calendar, color: "text-purple-500" },
    { label: isRu ? "Группа" : "Топ", href: `/org/student/group`, icon: Users, color: "text-indigo-500" },
    { label: isRu ? "Материалы" : "Материалдар", href: `/org/student/materials`, icon: BookOpen, color: "text-amber-500" },
    { label: isRu ? "Отчёты" : "Есептер", href: `/org/student/report`, icon: FileText, color: "text-rose-500" },
    { label: isRu ? "Привычки" : "Әдеттер", href: `/org/student/habits`, icon: CheckCircle, color: "text-emerald-500" },
    { label: isRu ? "Рейтинг" : "Рейтинг", href: `/org/student/rating`, icon: Trophy, color: "text-yellow-500" },
    { label: isRu ? "Матрица" : "Матрица", href: `/org/student/matrix`, icon: Grid, color: "text-teal-500" },
    { label: isRu ? "Чат" : "Чат", href: `/org/student/chat`, icon: MessageSquare, color: "text-sky-500", badge: isRu ? "Скоро" : "Жақында" },
    { label: isRu ? "Профиль" : "Профиль", href: `/org/student/profile`, icon: User, color: "text-slate-500" },
  ], [orgId, isRu]);

  return (
    <DashboardShell 
      eyebrow={isRu ? "Кабинет ученика" : "Оқушы кабинеті"}
      title="LOOPIT"
      navItems={studentNavItems}
    >
      {children}
    </DashboardShell>
  );
}