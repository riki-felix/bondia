import { useId, useMemo } from "react";
import { Pencil } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import { formatEuro } from "@/lib/moneyCalc";
import {
  computeInvertidoEvolution,
  type InvertidoByYear,
} from "@/lib/invertidoStorage";
import { cn } from "@/lib/utils";

interface InvertidoChartProps {
  byYear: InvertidoByYear;
  activeYear: number | null;
  invertido: number;
  viewLabel: string;
  yearComparisonPct?: number | null;
  onEdit: () => void;
}

const chartConfig = {
  increment: {
    label: "Inversión del año",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function InvertidoChart({
  byYear,
  activeYear,
  invertido,
  viewLabel,
  yearComparisonPct,
  onEdit,
}: InvertidoChartProps) {
  const gradientId = useId().replace(/:/g, "");

  const evolution = useMemo(
    () => computeInvertidoEvolution(byYear),
    [byYear]
  );

  const chartData = useMemo(
    () =>
      evolution.map((d) => ({
        year: String(d.year),
        yearNum: d.year,
        amount: d.amount,
        increment: d.increment,
      })),
    [evolution]
  );

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1">
          {chartData.length === 0 ? (
            <div className="flex h-[100px] items-center justify-center text-sm text-muted-foreground">
              Sin datos — clic en el importe para añadir ejercicios
            </div>
          ) : (
            <div className="space-y-2">
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[96px] w-full [&_.recharts-surface]:overflow-visible"
              >
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 16, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--primary)"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--primary)"
                        stopOpacity={0.05}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="year"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    interval={0}
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis hide domain={[0, "auto"]} />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.year ?? ""
                        }
                        formatter={(value, _name, item) => (
                          <span className="tabular-nums">
                            {formatEuro(Number(value))}
                            {item?.payload?.amount != null && (
                              <span className="text-muted-foreground">
                                {" "}
                                · acum. {formatEuro(Number(item.payload.amount))}
                              </span>
                            )}
                          </span>
                        )}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="increment"
                    stroke="var(--color-increment)"
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={({ cx, cy, payload }) => {
                      if (cx == null || cy == null) return null;
                      const isActive =
                        activeYear != null && payload.yearNum === activeYear;
                      return (
                        <circle
                          key={payload.year}
                          cx={cx}
                          cy={cy}
                          r={isActive ? 5 : 3.5}
                          fill="var(--background)"
                          stroke="var(--color-increment)"
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                      );
                    }}
                    activeDot={{
                      r: 6,
                      strokeWidth: 2.5,
                      fill: "var(--background)",
                      stroke: "var(--color-increment)",
                    }}
                  />
                </AreaChart>
              </ChartContainer>

              <div className="flex flex-wrap items-end justify-center gap-x-5 gap-y-1 border-t pt-2">
                {chartData.map((d) => {
                  const isActive =
                    activeYear != null && d.yearNum === activeYear;
                  return (
                    <div
                      key={d.year}
                      className={cn(
                        "text-center",
                        isActive && "rounded-md bg-muted/60 px-2 py-0.5"
                      )}
                    >
                      <p className="text-[10px] text-muted-foreground">{d.year}</p>
                      <p
                        data-money
                        className={cn(
                          "text-xs tabular-nums",
                          isActive ? "font-bold" : "font-semibold"
                        )}
                      >
                        {formatEuro(d.increment)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex shrink-0 flex-col justify-center",
            chartData.length > 0 && "sm:border-l sm:pl-4",
            "min-w-[168px]"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              Invertido
              <Pencil className="h-3 w-3" />
            </p>
            {activeYear != null && yearComparisonPct != null && (
              <YearOverYearIndicator pct={yearComparisonPct} />
            )}
          </div>
          <button
            type="button"
            data-money
            className="mt-0.5 text-left text-xl font-semibold tabular-nums hover:text-primary transition-colors"
            onClick={onEdit}
          >
            {formatEuro(invertido)}
          </button>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {viewLabel} · Clic para editar
          </p>
        </div>
      </div>
    </div>
  );
}
