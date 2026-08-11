"use client";

import React from "react";
import { useParams } from "next/navigation";

export default function LoadingState() {
  const params = useParams();
  const isRu = params?.lang === "ru";

  return (
    <div className="w-full min-h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white shadow-sm border border-mist-light">
        <span className="h-2.5 w-2.5 rounded-full bg-horizon animate-pulse" />
        <span className="text-sm font-medium text-ink">
          {isRu ? "Загрузка..." : "Жүктелуде..."}
        </span>
      </div>
    </div>
  );
}