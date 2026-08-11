export default function CircularProgress({ percent, size = 64, strokeWidth = 6, label }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--color-paper-dim)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-horizon)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute font-display font-bold text-ink" style={{ fontSize: size * 0.24 }}>
        {label ?? `${percent}%`}
      </span>
    </div>
  );
}
