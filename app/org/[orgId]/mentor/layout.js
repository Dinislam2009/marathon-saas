"use client";

import { use } from "react";
import { Users } from "lucide-react";
import DashboardShell from "@/components/ui/DashboardShell";

export default function MentorLayout({ children, params }) {
  const { orgId } = use(params);
  const navItems = [{ href: `/org/${orgId}/mentor`, label: "Менің оқушыларым", icon: Users }];

  return (
    <DashboardShell theme="ink" eyebrow="Ментор" title="Ментор кабинеті" navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
