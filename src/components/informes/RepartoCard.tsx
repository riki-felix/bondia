import { useState } from "react";
import { Cell, Label, Pie, PieChart, Tooltip } from "recharts";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import { type RepartoModo, type RepartoStats } from "@/lib/repartoStats";
import { formatEuro } from "@/lib/moneyCalc";
import { cn } from "@/lib/utils";

interface RepartoCardProps {
  real: RepartoStats;
  teorico: RepartoStats;
  yearFilter: string;
  brutoYoYPct?: number | null;
  className?: string;
}

const COLORS: Record<string, string> = {
  sanyus: "var(--chart-1)",
  castello: "var(--chart-2)",
  jasp: "var(--chart-3)",
};

const CHART_SIZE = 220;

export function RepartoCard({
  real,
  teorico,
  yearFilter,
  brutoYoYPct,
  className,
}: RepartoCardProps) {
  const [modo, setModo] = useState<RepartoModo>("real");
  const stats = modo === "real" ? real : teorico;

  const vistaLabel =
    yearFilter === "all" ? "Todos los ejercicios" : `Ejercicio ${yearFilter}`;

  const total = stats.brutoTotal;
  const hasChart = total > 0 && stats.slices.length > 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="p-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold tracking-tight">Reparto bruto</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {vistaLabel} · Reparto del bruto
            </p>
          </div>
          {brutoYoYPct != null && (
            <YearOverYearIndicator pct={brutoYoYPct} className="shrink-0" />
          )}
        </div>

        <div className="mt-3 flex rounded-lg border p-0.5">
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              modo === "real"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setModo("real")}
          >
            Real
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              modo === "teorico"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setModo("teorico")}
          >
            40 · 40 · 20
          </button>
        </div>

        {hasChart ? (
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
            <div className="shrink-0" style={{ width: CHART_SIZE, height: CHART_SIZE }}>
              <PieChart width={CHART_SIZE} height={CHART_SIZE}>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0];
                    const value = item.value as number;
                    return (
                      <div className="rounded-lg border bg-background px-3 py-1.5 text-xs shadow-md">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground">
                          {formatEuro(value)}
                          {total > 0 && (
                            <span className="ml-1">
                              ({((value / total) * 100).toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Pie
                  data={stats.slices}
                  dataKey="value"
                  nameKey="name"
                  cx={CHART_SIZE / 2}
                  cy={CHART_SIZE / 2}
                  innerRadius={CHART_SIZE * 0.29}
                  outerRadius={CHART_SIZE * 0.44}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {stats.slices.map((entry) => (
                    <Cell key={entry.id} fill={COLORS[entry.id]} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 6}
                              className="fill-foreground text-lg font-bold"
                            >
                              {formatEuro(total)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 14}
                              className="fill-muted-foreground text-[10px]"
                            >
                              Bruto
                            </tspan>
                          </text>
                        );
                      }
                      return null;
                    }}
                  />
                </Pie>
              </PieChart>
            </div>

            <ul className="w-full max-w-xs space-y-2.5 text-sm sm:w-auto sm:min-w-[200px]">
              {stats.slices.map((slice) => {
                const pct = total > 0 ? (slice.value / total) * 100 : 0;
                return (
                  <li key={slice.id} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: COLORS[slice.id] }}
                    />
                    <span className="min-w-0 flex-1 truncate">{slice.name}</span>
                    <span
                      data-money
                      className="shrink-0 tabular-nums text-sm font-medium"
                    >
                      {formatEuro(slice.value)}
                    </span>
                    <span className="w-10 shrink-0 text-right tabular-nums text-xs text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center py-10 text-sm text-muted-foreground">
            Sin bruto para repartir en esta vista
          </div>
        )}
      </div>

      <div className="mt-auto border-t bg-muted/40 px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {modo === "real"
            ? "Según participaciones configuradas en cada propiedad (Sanyus, Castello y JASP)."
            : "Reparto teórico fijo: 40% Sanyus, 40% Castello y 20% JASP sobre el mismo bruto."}
        </p>
      </div>
    </div>
  );
}
