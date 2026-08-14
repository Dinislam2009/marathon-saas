"use client";

import { useParams } from "next/navigation";
import { 
  BarChart3, 
  UserPlus, 
  Users, 
  Inbox, 
  Link as LinkIcon 
} from "lucide-react";
import DashboardShell from "@/components/DashboardShell";
import { useLanguage } from "@/context/LanguageContext";

export default function ManagerLayout({ children }) {
  const { lang } = useLanguage();
  const isRu = lang === "ru";

  // ⚡ URL-ден динамикалық [orgId]-ді ұстап аламыз
  const params = useParams();
  const orgId = params?.orgId || "";

  const navItems = [
    { 
      href: `/${lang}/org/${orgId}/manager`, 
      label: isRu ? "Дашборд & KPI" : "Дашборд & KPI", 
      icon: BarChart3 
    },
    { 
      href: `/${lang}/org/${orgId}/manager/add-student`, 
      label: isRu ? "Быстрый ввод" : "Жылдам тіркеу", 
      icon: UserPlus 
    },
    { 
      href: `/${lang}/org/${orgId}/manager/students`, 
      label: isRu ? "Моя база (CRM)" : "Менің оқушыларым", 
      icon: Users 
    },
    { 
      href: `/${lang}/org/${orgId}/manager/unassigned`, 
      label: isRu ? "Нераспределенные" : "Бос оқушылар", 
      icon: Inbox 
    },
    { 
      href: `/${lang}/org/${orgId}/manager/ref-links`, 
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