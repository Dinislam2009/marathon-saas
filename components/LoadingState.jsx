import React from "react";

export default function LoadingState() {
  return (
    <div className="w-full min-h-[calc(100vh-150px)] flex items-center justify-center">
      <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white shadow-sm border border-mist-light">
        <span className="h-2.5 w-2.5 rounded-full bg-horizon animate-pulse" />
        <span className="text-sm font-medium text-ink">
          Жүктелуде...
        </span>
      </div>
    </div>
  );
}