import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-paper-dim text-ink",
  steppe: "bg-steppe-light text-steppe",
  ember: "bg-ember-light text-ember",
  horizon: "bg-horizon/10 text-horizon-dark",
};

export default function Badge({ children, tone = "neutral", className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
