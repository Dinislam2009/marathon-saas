"use client";

import { use } from "react";
import MobileTabBar from "@/components/ui/MobileTabBar";

// Demo student switcher moved into /profile (no header bar in the
// mobile-first layout — see app/org/[orgId]/student/profile/page.js).
export default function StudentLayout({ children, params }) {
  const { orgId } = use(params);
  return <MobileTabBar orgId={orgId}>{children}</MobileTabBar>;
}
