import { cn } from "@/lib/utils";
import type { ObjetivoProgressTone } from "@/lib/objetivos";

const STROKE: Record<ObjetivoProgressTone, string> = {
  red: "#dc2626",
  yellow: "#ca8a04",
  green: "#16a34a",
  muted: "hsl(var(--muted-foreground) / 0.35)",
};

interface GoalProgressRingProps {
  percent: number;
  tone: ObjetivoProgressTone;
  size?: number;
  className?: string;
}

export function GoalProgressRing({
  percent,
  tone,
  size = 52,
  className,
}: GoalProgressRingProps) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = circumference * (1 - clamped / 100);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90 shrink-0", className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(var(--muted-foreground) / 0.2)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={STROKE[tone]}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}
