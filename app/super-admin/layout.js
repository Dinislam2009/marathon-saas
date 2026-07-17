"use client";

import { Building2 } from "lucide-react";
import DashboardShell from "@/components/ui/DashboardShell";

const NAV_ITEMS = [{ href: "/super-admin", label: "Ұйымдастырушылар", icon: Building2 }];

export default function SuperAdminLayout({ children }) {
  return (
    <DashboardShell theme="dusk" eyebrow="Super Admin" title="Платформа басқару" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}
