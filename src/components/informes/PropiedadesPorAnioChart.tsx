import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";

interface PropiedadesPorAnioChartProps {
  data: { year: number; count: number }[];
  totalCount?: number;
  yearComparisonPct?: number | null;
}

const chartConfig = {
  count: {
    label: "Propiedades",
    color: "hsl(var(--foreground))",
  },
} satisfies ChartConfig;

export function PropiedadesPorAnioChart({
  data,
  totalCount,
  yearComparisonPct,
}: PropiedadesPorAnioChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-lg border bg-card text-sm text-muted-foreground">
        No hay datos para esta vista
      </div>
    );
  }

  const chartData = data.map((d) => ({
    year: String(d.year),
    count: d.count,
  }));

  return (
    <div className="space-y-3">
      {totalCount != null && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-2xl font-semibold tabular-nums">{totalCount}</p>
          {yearComparisonPct != null && (
            <YearOverYearIndicator pct={yearComparisonPct} />
          )}
        </div>
      )}
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
    </div>
  );
}
