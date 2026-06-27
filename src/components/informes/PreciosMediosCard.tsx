import { formatEuro } from "@/lib/moneyCalc";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import type { PreciosMediosStats } from "@/lib/informesStats";
import { cn } from "@/lib/utils";

interface PreciosMediosCardProps {
  preciosMedios: PreciosMediosStats;
  yearFilter: string;
  compraYoYPct?: number | null;
  ventaYoYPct?: number | null;
  className?: string;
}

function PrecioRow({
  label,
  value,
  countLabel,
  yearComparisonPct,
}: {
  label: string;
  value: string;
  countLabel: string;
  yearComparisonPct?: number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p data-money className="text-xl font-semibold tabular-nums">
          {value}
        </p>
        {yearComparisonPct != null && (
          <YearOverYearIndicator pct={yearComparisonPct} />
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
    </div>
  );
}

export function PreciosMediosCard({
  preciosMedios,
  yearFilter,
  compraYoYPct,
  ventaYoYPct,
  className,
}: PreciosMediosCardProps) {
  const compraCountLabel =
    preciosMedios.comprasEnVista > 0
      ? yearFilter !== "all"
        ? `${preciosMedios.comprasEnVista} en ejercicio ${yearFilter}`
        : `${preciosMedios.comprasEnVista} con precio de compra`
      : yearFilter !== "all"
        ? `Sin precios en ejercicio ${yearFilter}`
        : "Sin precios de compra en esta vista";

  const ventaCountLabel =
    preciosMedios.ventasEnVista > 0
      ? yearFilter !== "all"
        ? `${preciosMedios.ventasEnVista} en ejercicio ${yearFilter}`
        : `${preciosMedios.ventasEnVista} con precio de venta`
      : yearFilter !== "all"
        ? `Sin precios en ejercicio ${yearFilter}`
        : "Sin precios de venta en esta vista";

  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Precios medios
      </p>
      <div className="grid grid-cols-2 gap-4">
        <PrecioRow
          label="Compra"
          value={
            preciosMedios.precioMedioCompra != null
              ? formatEuro(preciosMedios.precioMedioCompra)
              : "—"
          }
          countLabel={compraCountLabel}
          yearComparisonPct={compraYoYPct}
        />
        <PrecioRow
          label="Venta"
          value={
            preciosMedios.precioMedioVenta != null
              ? formatEuro(preciosMedios.precioMedioVenta)
              : "—"
          }
          countLabel={ventaCountLabel}
          yearComparisonPct={ventaYoYPct}
        />
      </div>
    </div>
  );
}
