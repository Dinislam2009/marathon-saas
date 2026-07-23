"use client";

import { use } from "react";
import MobileTabBar from "@/components/ui/MobileTabBar";

export default function StudentLayout({ children, params }) {
  // Next.js-те params өрнегін қауіпсіз алу
  const resolvedParams = use(params);
  const orgId = resolvedParams?.orgId;

  return (
    <MobileTabBar orgId={orgId}>
      {children}
    </MobileTabBar>
  );
}