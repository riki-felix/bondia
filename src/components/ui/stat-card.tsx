import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  variant?: "default" | "highlight" | "muted";
  className?: string;
}

export function StatCard({
  label,
  value,
  description,
  variant = "default",
  className,
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
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
