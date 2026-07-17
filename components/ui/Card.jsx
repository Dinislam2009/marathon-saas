import { cn } from "@/lib/utils";

export default function Card({ children, className, padded = true, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-mist-light bg-white",
        padded && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 mb-4", className)}>
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-sm text-mist mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
