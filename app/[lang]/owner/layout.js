import React from "react";
import OwnerSidebar from "@/components/OwnerSidebar";

export default function OwnerLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      <OwnerSidebar />
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto min-w-0">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}