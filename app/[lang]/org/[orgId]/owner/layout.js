"use client";

import React from "react";
import { useParams } from "next/navigation";
import OwnerSidebar from "@/components/OwnerSidebar";

export default function OwnerLayout({ children }) {
  const params = useParams();
  const orgId = params?.orgId || "";

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      {/* orgId-ді props ретінде береміз, егер сайдбар ішінде керек болса */}
      <OwnerSidebar orgId={orgId} />
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto min-w-0">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}