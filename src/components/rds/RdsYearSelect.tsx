import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { rdsYearOptions } from "@/lib/rdsStats";

interface RdsYearSelectProps {
  value: number;
  /** Ruta base; al cambiar año envía GET a `{navigateTo}?year=` */
  navigateTo: string;
  extraYears?: number[];
  className?: string;
}

const SELECT_CLASS =
  "flex h-9 w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function RdsYearSelect({
  value,
  navigateTo,
  extraYears = [],
  className,
}: RdsYearSelectProps) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => rdsYearOptions(currentYear, [value, ...extraYears]),
    [currentYear, value, extraYears]
  );

  return (
    <form method="get" action={navigateTo} className="inline">
      <select
        aria-label="Año"
        name="year"
        className={cn(SELECT_CLASS, className)}
        defaultValue={String(value)}
        onChange={(e) => {
          e.currentTarget.form?.submit();
        }}
      >
        {years.map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </form>
  );
}
