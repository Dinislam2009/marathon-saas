"use client";

import { use } from "react";
import { Flag, UserCog, Home } from "lucide-react"; // Home иконкасын қостық
import DashboardShell from "@/components/ui/DashboardShell";

// Басты бетті бірінші орынға қосып, мәтіндерді орысшаладық
const NAV_ITEMS = (orgId) => [
  { href: "/", label: "Главная", icon: Home },
  { href: `/org/${orgId}/admin`, label: "Марафоны", icon: Flag },
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