import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface YearOverYearIndicatorProps {
  pct: number;
  className?: string;
}

export function YearOverYearIndicator({
  pct,
  className,
}: YearOverYearIndicatorProps) {
  const isUp = pct > 0;
  const isDown = pct < 0;
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums",
        isUp && "text-green-600",
        isDown && "text-red-600",
        !isUp && !isDown && "text-muted-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      {Math.abs(pct)} %
    </span>
  );
}
