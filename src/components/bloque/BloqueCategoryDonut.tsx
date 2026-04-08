// src/components/bloque/BloqueCategoryDonut.tsx
import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Label } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Switch } from "@/components/ui/switch";
import { formatEuro } from "@/lib/moneyCalc";

// ─── Palette ─────────────────────────────────────────────────

const COLORS = [
  "oklch(0.25 0 0)",
  "oklch(0.35 0 0)",
  "oklch(0.45 0 0)",
  "oklch(0.55 0 0)",
  "oklch(0.62 0 0)",
  "oklch(0.69 0 0)",
  "oklch(0.75 0 0)",
  "oklch(0.80 0 0)",
  "oklch(0.85 0 0)",
  "oklch(0.89 0 0)",
  "oklch(0.93 0 0)",
  "oklch(0.96 0 0)",
];

// ─── Types ───────────────────────────────────────────────────

export interface CategoryDonutItem {
  id: string;
  name: string;
  value: number;
}

interface BloqueCategoryDonutProps {
  data: CategoryDonutItem[];
  /** Label shown in center below value, e.g. "Gastos anuales" */
  label?: string;
  /** Label for monthly average center text, e.g. "Promedio mensual" */
  labelMensual?: string;
  /** Set false to hide the monthly toggle (e.g. for activos) */
  showMensual?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export default function BloqueCategoryDonut({
  data,
  label,
  labelMensual = "Promedio mensual",
  showMensual = true,
}: BloqueCategoryDonutProps) {
  // Sorted by value desc
  const sorted = useMemo(
    () => [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value),
    [data]
  );

  const [mode, setMode] = useState<"total" | "mensual">("total");
  // All categories enabled by default (only those with value > 0)
  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(sorted.map((d) => d.id))
  );

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const enableAll = () => setEnabled(new Set(sorted.map((d) => d.id)));
  const disableAll = () => setEnabled(new Set());

  const allChecked = enabled.size === sorted.length && sorted.length > 0;

  // Color map — stable by sorted order
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    sorted.forEach((item, i) => {
      map.set(item.id, COLORS[i % COLORS.length]);
    });
    return map;
  }, [sorted]);

  // Divisor: 1 for total, 12 for monthly average
  const divisor = mode === "mensual" ? 12 : 1;

  // Filtered data for the chart
  const chartData = useMemo(
    () => sorted.filter((d) => enabled.has(d.id)).map((d) => ({ ...d, value: Math.round(d.value / divisor * 100) / 100 })),
    [sorted, enabled, divisor]
  );

  // Total of enabled categories
  const total = useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData]
  );

  const centerLabel = mode === "mensual" ? labelMensual : label;

  // Build chart config for the ChartContainer
  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    for (const item of sorted) {
      cfg[item.id] = {
        label: item.name,
        color: colorMap.get(item.id)!,
      };
    }
    return cfg;
  }, [sorted, colorMap]);

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Sin datos para mostrar.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-4 items-start w-full">
      {/* ── Donut (2/6) ── */}
      <div className="col-span-2 flex flex-col items-center gap-2">
        {showMensual && (
          <div className="flex items-center gap-0.5 rounded-md border p-0.5 self-center">
            <button
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                mode === "total"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("total")}
            >
              Total
            </button>
            <button
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                mode === "mensual"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("mensual")}
            >
              Mensual
            </button>
          </div>
        )}
        <ChartContainer config={chartConfig} className="aspect-square w-full">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0];
              return (
                <div className="rounded-lg border bg-background px-3 py-1.5 text-xs shadow-xl">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground">
                    {formatEuro(item.value as number)}
                    {total > 0 && (
                      <span className="ml-1">
                        ({((item.value as number) / total * 100).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            }}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="90%"
            paddingAngle={1}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.id}
                fill={colorMap.get(entry.id)}
              />
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
                      {label && (
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 12}
                          className="fill-muted-foreground text-[10px]"
                        >
                          {centerLabel}
                        </tspan>
                      )}
                    </text>
                  );
                }
                return null;
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>
      </div>

      {/* ── Category toggles (4/6) ── */}
      <div className="col-span-4 text-sm min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-xs text-muted-foreground">Categorías</span>
          <Switch
            checked={allChecked}
            onCheckedChange={(checked) => checked ? enableAll() : disableAll()}
            className="scale-75"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {sorted.map((item) => {
            const active = enabled.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`flex items-center gap-2 px-2 py-1 rounded transition-colors text-left ${
                  active
                    ? "bg-muted/60"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: colorMap.get(item.id) }}
                />
                <span className="truncate">{item.name}</span>
                <span className="ml-auto tabular-nums text-muted-foreground text-xs whitespace-nowrap">
                  {formatEuro(item.value / divisor)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
