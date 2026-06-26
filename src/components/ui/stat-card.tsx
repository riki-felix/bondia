import { cn } from "@/lib/utils";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  variant?: "default" | "highlight" | "muted";
  className?: string;
  yearComparisonPct?: number | null;
}

export function StatCard({
  label,
  value,
  description,
  variant = "default",
  className,
  yearComparisonPct,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        variant === "highlight" && "bg-yellow-50 border-yellow-200",
        variant === "muted" && "bg-muted/40",
        variant === "default" && "bg-card",
        className
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p data-money className="text-2xl font-semibold tabular-nums">
          {value}
        </p>
        {yearComparisonPct != null && (
          <YearOverYearIndicator pct={yearComparisonPct} />
        )}
      </div>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
