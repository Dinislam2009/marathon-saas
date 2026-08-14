"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
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

export default function StudentLayout({ children }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  // ⚡ URL-ден [orgId] мен [lang] мәнін аламыз
  const params = useParams();
  const orgId = params?.orgId || "";

  // Меню тізімі (Барлық сілтемелер жаңа [orgId] папкасына байланған)
  const studentNavItems = useMemo(() => [
    { label: isRu ? "Главная" : "Басты бет", href: `/${lang}/org/${orgId}/student`, icon: Home, color: "text-blue-500" },
    { label: isRu ? "Задания" : "Тапсырмалар", href: `/${lang}/org/${orgId}/student/tasks`, icon: CheckSquare, color: "text-purple-600" },
    { label: isRu ? "Календарь" : "Күнтізбе", href: `/${lang}/org/${orgId}/student/calendar`, icon: Calendar, color: "text-purple-500" },
    { label: isRu ? "Группа" : "Топ", href: `/${lang}/org/${orgId}/student/group`, icon: Users, color: "text-indigo-500" },
    { label: isRu ? "Материалы" : "Материалдар", href: `/${lang}/org/${orgId}/student/materials`, icon: BookOpen, color: "text-amber-500" },
    { label: isRu ? "Отчёты" : "Есептер", href: `/${lang}/org/${orgId}/student/report`, icon: FileText, color: "text-rose-500" },
    { label: isRu ? "Привычки" : "Әдеттер", href: `/${lang}/org/${orgId}/student/habits`, icon: CheckCircle, color: "text-emerald-500" },
    { label: isRu ? "Рейтинг" : "Рейтинг", href: `/${lang}/org/${orgId}/student/rating`, icon: Trophy, color: "text-yellow-500" },
    { label: isRu ? "Матрица" : "Матрица", href: `/${lang}/org/${orgId}/student/matrix`, icon: Grid, color: "text-teal-500" },
    { label: isRu ? "Чат" : "Чат", href: `/${lang}/org/${orgId}/student/chat`, icon: MessageSquare, color: "text-sky-500", badge: isRu ? "Скоро" : "Жақында" },
    { label: isRu ? "Профиль" : "Профиль", href: `/${lang}/org/${orgId}/student/profile`, icon: User, color: "text-slate-500" },
  ], [orgId, lang, isRu]);

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