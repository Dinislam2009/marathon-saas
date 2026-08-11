"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_LIVES } from "@/lib/constants";

export default function LivesBadge({ lives, size = 18, className }) {
  return (
    <div className={cn("flex items-center gap-1", className)} title={`${lives}/${DEFAULT_LIVES} жан`}>
      {Array.from({ length: DEFAULT_LIVES }, (_, i) => {
        const filled = i < lives;
        return (
          <Heart
            key={i}
            size={size}
            className={filled ? "fill-ember text-ember" : "text-mist-light"}
            strokeWidth={filled ? 0 : 1.5}
          />
        );
      })}
    </div>
  );
}
