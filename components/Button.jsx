"use client";

import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-horizon text-white hover:bg-horizon-dark shadow-sm shadow-horizon/20",
  secondary: "bg-white text-ink border border-mist-light hover:border-mist hover:bg-paper-dim",
  danger: "bg-ember text-white hover:bg-ember/90",
  ghost: "bg-transparent text-ink hover:bg-paper-dim",
};

const SIZES = {
  default: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-6 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "default",
  className,
  type = "button",
  disabled = false,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-horizon focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
