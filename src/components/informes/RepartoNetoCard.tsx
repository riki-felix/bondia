import type { RepartoNetoTotals } from "@/lib/repartoStats";
import { formatEuro } from "@/lib/moneyCalc";
import { cn } from "@/lib/utils";

interface RepartoNetoCardProps {
  neto: RepartoNetoTotals;
  yearFilter: string;
  compact?: boolean;
  className?: string;
}

const ROWS: {
  id: keyof RepartoNetoTotals;
  name: string;
  metric: string;
  color: string;
}[] = [
  { id: "sanyus", name: "Sanyus", metric: "Transferencias", color: "var(--chart-1)" },
  { id: "castello", name: "Castello", metric: "Neto", color: "var(--chart-2)" },
  { id: "jasp", name: "JASP", metric: "Real", color: "var(--chart-3)" },
];

export function RepartoNetoCard({
  neto,
  yearFilter,
  compact = false,
  className,
}: RepartoNetoCardProps) {
  const vistaLabel =
    yearFilter === "all" ? "Todos los ejercicios" : `Ejercicio ${yearFilter}`;

  const total = neto.sanyus + neto.castello + neto.jasp;
  const hasData = total > 0;

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className={cn("flex flex-col", compact ? "p-4" : "p-5")}>
        <div className="min-w-0">
          <p className="font-semibold tracking-tight">Reparto neto</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{vistaLabel}</p>
        </div>

        {hasData ? (
          <ul className={cn("space-y-2", compact ? "mt-3" : "mt-4")}>
            {ROWS.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border bg-muted/30",
                  compact ? "px-3 py-2" : "px-3 py-2.5"
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{row.name}</p>
                  <p className="text-[11px] text-muted-foreground">{row.metric}</p>
                </div>
                <span
                  data-money
                  className={cn(
                    "shrink-0 font-semibold tabular-nums tracking-tight",
                    compact ? "text-base" : "text-lg"
                  )}
                >
                  {formatEuro(neto[row.id])}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className={cn(
              "flex items-center justify-center text-sm text-muted-foreground",
              compact ? "py-6" : "py-8"
            )}
          >
            Sin importes netos en esta vista
          </div>
        )}
      </div>

      {!compact && (
        <div className="border-t bg-muted/40 px-5 py-3">
          <p className="text-xs text-muted-foreground">
            Sanyus por transferencias; Castello y JASP según desglose operativo.
          </p>
        </div>
      )}
    </div>
  );
}
