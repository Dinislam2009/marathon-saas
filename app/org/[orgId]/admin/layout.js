"use client";

import { use } from "react";
import { Flag, UserCog, Users } from "lucide-react";
import DashboardShell from "@/components/ui/DashboardShell";

const NAV_ITEMS = (orgId) => [
  { href: `/org/${orgId}/admin`, label: "Марафоны", icon: Flag },
  { href: `/org/${orgId}/admin/students`, label: "Участники", icon: Users },
  { href: `/org/${orgId}/admin/mentors`, label: "Менторы", icon: UserCog },
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