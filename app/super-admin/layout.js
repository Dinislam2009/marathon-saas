"use client";

import { Building2, Home } from "lucide-react"; // Home иконкасын қостық
import DashboardShell from "@/components/ui/DashboardShell";

// Главная батырмасын қосып, мәтіндерді орысшаладық
const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/super-admin", label: "Организации", icon: Building2 }
];

export default function SuperAdminLayout({ children }) {
  return (
    <DashboardShell theme="dusk" eyebrow="Платформа" title="Панель владельца" navItems={NAV_ITEMS}>
      {children}
    </DashboardShell>
  );
}