import { cn, scoreColor } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { outer: 56, stroke: 4, text: "text-sm" },
  md: { outer: 80, stroke: 5, text: "text-base" },
  lg: { outer: 112, stroke: 7, text: "text-xl" },
};

export function ScoreRing({ score, label, size = "md", className }: ScoreRingProps) {
  const { outer, stroke, text } = SIZES[size];
  const r = (outer - stroke * 2) / 2;
  const cx = outer / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, score)) / 100) * circumference;

  const strokeColor =
    score >= 75 ? "#10b981" : score >= 50 ? "#eab308" : score >= 25 ? "#f97316" : "#ef4444";

  return (
    <div className={cn("relative inline-flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg width={outer} height={outer} className="rotate-[-90deg]">
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold tabular-nums", text, scoreColor(score))}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground text-center">{label}</span>}
    </div>
  );
}
