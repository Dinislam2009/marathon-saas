"use client";

import { use } from "react";
import { Flag, UserCog } from "lucide-react";
import DashboardShell from "@/components/ui/DashboardShell";

const NAV_ITEMS = (orgId) => [
  { href: `/org/${orgId}/admin`, label: "Марафондар", icon: Flag },
  { href: `/org/${orgId}/admin/mentors`, label: "Менторлар", icon: UserCog },
];

export default function TenantAdminLayout({ children, params }) {
  const { orgId } = use(params);

  return (
    <DashboardShell
      theme="ink"
      eyebrow="Ұйымдастырушы"
      title="Марафон кабинеті"
      navItems={NAV_ITEMS(orgId)}
    >
      {children}
    </DashboardShell>
  );
}
