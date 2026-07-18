"use client";

import { use } from "react";
import { Users, Home } from "lucide-react"; // Home иконкасын қостық
import DashboardShell from "@/components/ui/DashboardShell";

export default function MentorLayout({ children, params }) {
  const { orgId } = use(params);
  
  // Навигация тізіміне "Главная" батырмасын бірінші кезекке қостық
  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: `/org/${orgId}/mentor`, label: "Мои студенты", icon: Users }
  ];

  return (
    <DashboardShell theme="ink" eyebrow="Ментор" title="Кабинет ментора" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
