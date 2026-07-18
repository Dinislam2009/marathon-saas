"use client";

import { use } from "react";
import { Home, Users } from "lucide-react";
import DashboardShell from "@/components/ui/DashboardShell";

export default function MentorLayout({ children, params }) {
  const { orgId } = use(params);
  
  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: `/org/${orgId}/mentor`, label: "Кабинет ментора", icon: Users }
  ];

  return (
    <DashboardShell theme="ink" eyebrow="Ментор" title="Кабинет ментора" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}