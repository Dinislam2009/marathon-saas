"use client";

import { use } from "react";
import DashboardShell from "@/components/ui/DashboardShell";
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
  User 
} from "lucide-react";

export default function StudentLayout({ children, params }) {
  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId || "orgId";

  // Студенттік кабинетке арналған меню тізімі
  const studentNavItems = [
    { label: "Главная", href: `/org/${orgId}/student`, icon: Home },
    { label: "Календарь", href: `/org/${orgId}/student/calendar`, icon: Calendar },
    { label: "Группа", href: `/org/${orgId}/student/group`, icon: Users },
    { label: "Материалы", href: `/org/${orgId}/student/materials`, icon: BookOpen },
    { label: "Отчёт", href: `/org/${orgId}/student/report`, icon: FileText },
    { label: "Привычки", href: `/org/${orgId}/student/habits`, icon: CheckCircle },
    { label: "Рейтинг", href: `/org/${orgId}/student/rating`, icon: Trophy },
    { label: "Матрица", href: `/org/${orgId}/student/matrix`, icon: Grid },
    { label: "Чат", href: `/org/${orgId}/student/chat`, icon: MessageSquare },
    { label: "Профиль", href: `/org/${orgId}/student/profile`, icon: User },
  ];

  return (
    <DashboardShell 
      eyebrow="Кабинет ученика"
      title="LOOPIT"
      navItems={studentNavItems}
    >
      {children}
    </DashboardShell>
  );
}