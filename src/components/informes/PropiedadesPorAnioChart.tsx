import { useId, useMemo } from "react";
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
import type { PropiedadesPorAnioEntry } from "@/lib/informesStats";
import { cn } from "@/lib/utils";

interface PropiedadesPorAnioChartProps {
  evolution: PropiedadesPorAnioEntry[];
  activeYear: number | null;
  listByYear: PropiedadesPorAnioEntry[];
  totalCount: number;
  yearComparisonPct?: number | null;
  compact?: boolean;
}

const chartConfig = {
  count: {
    label: "Propiedades",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function PropertyRow({
  id,
  titulo,
  numero_operacion,
}: {
  id: string;
  titulo: string;
  numero_operacion: number | null;
}) {
  return (
    <a
      href={`/propiedades/${id}`}
      className="flex min-w-0 items-baseline gap-2 rounded px-1 py-0.5 text-xs hover:bg-muted/60 transition-colors"
    >
      {numero_operacion != null && (
        <span className="w-7 shrink-0 tabular-nums text-muted-foreground">
          #{numero_operacion}
        </span>
      )}
      <span className="min-w-0 truncate">{titulo}</span>
    </a>
  );
}

export function PropiedadesPorAnioChart({
  evolution,
  activeYear,
  listByYear,
  totalCount,
  yearComparisonPct,
  compact = false,
}: PropiedadesPorAnioChartProps) {
  const gradientId = useId().replace(/:/g, "");

  const chartData = useMemo(
    () =>
      evolution.map((d) => ({
        year: String(d.year),
        yearNum: d.year,
        count: d.count,
      })),
    [evolution]
  );

  const groupedList = activeYear == null;

  const subtitle =
    activeYear != null
      ? `${totalCount} ${totalCount === 1 ? "propiedad" : "propiedades"} en ${activeYear}`
      : `${totalCount} ${totalCount === 1 ? "propiedad" : "propiedades"} en total`;

  if (evolution.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        No hay datos para esta vista
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold tracking-tight">Propiedades por año</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {activeYear != null && yearComparisonPct != null && (
          <YearOverYearIndicator pct={yearComparisonPct} />
        )}
      </div>

      <ChartContainer
        config={chartConfig}
        className={cn(
          "aspect-auto w-full",
          compact ? "h-[140px]" : "h-[160px]"
        )}
      >
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.45} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis hide domain={[0, "auto"]} />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.year ?? ""
                }
              />
            }
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-count)"
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
                  stroke="var(--color-count)"
                  strokeWidth={isActive ? 2.5 : 2}
                />
              );
            }}
            activeDot={{
              r: 6,
              strokeWidth: 2.5,
              fill: "var(--background)",
              stroke: "var(--color-count)",
            }}
          />
        </AreaChart>
      </ChartContainer>

      {listByYear.length > 0 ? (
        <div
          className={cn(
            "overflow-y-auto border-t pt-3",
            compact ? "max-h-[180px]" : "max-h-[220px]",
            groupedList ? "space-y-2.5" : "space-y-0"
          )}
        >
          {groupedList
            ? listByYear.map((group) => (
                <div key={group.year}>
                  <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {group.year} · {group.count}
                  </p>
                  <div className="space-y-0">
                    {group.properties.map((p) => (
                      <PropertyRow key={p.id} {...p} />
                    ))}
                  </div>
                </div>
              ))
            : listByYear[0]?.properties.map((p) => (
                <PropertyRow key={p.id} {...p} />
              ))}
        </div>
      ) : (
        <p className="border-t pt-3 text-xs text-muted-foreground">
          Sin propiedades en esta vista
        </p>
      )}
    </div>
  );
}
