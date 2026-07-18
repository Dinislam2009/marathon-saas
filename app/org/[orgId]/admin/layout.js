"use client";

import { use } from "react";
import { Flag, UserCog, Home, Users } from "lucide-react"; // Users иконкасын қостық
import DashboardShell from "@/components/ui/DashboardShell";

// Мәзірге "Участники" бетін қостық және орысшаладық
const NAV_ITEMS = (orgId) => [
  { href: "/", label: "Главная", icon: Home },
  { href: `/org/${orgId}/admin`, label: "Марафоны", icon: Flag },
  { href: `/org/${orgId}/admin/mentors`, label: "Mentors", icon: UserCog },
  { href: `/org/${orgId}/admin/students`, label: "Участники", icon: Users }, // Жаңа сілтеме
];

export default function TenantAdminLayout({ children, params }) {
  const { orgId } = use(params);

  return (
    <DashboardShell
      theme="ink"
      eyebrow="Организатор"
      title="Кабинет марафонов"
      navItems={NAV_ITEMS(orgId)}
    >
      {children}
    </DashboardShell>
  );
}