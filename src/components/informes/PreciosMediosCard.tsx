import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEuro } from "@/lib/moneyCalc";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import type { PreciosMediosStats } from "@/lib/informesStats";
import {
  computeDiffPctVsMercado,
  formatMercadoUpdatedAt,
} from "@/lib/mercadoReferencia";
import { cn } from "@/lib/utils";

interface PreciosMediosCardProps {
  preciosMedios: PreciosMediosStats;
  yearFilter: string;
  compraYoYPct?: number | null;
  ventaYoYPct?: number | null;
  compraM2YoYPct?: number | null;
  ventaM2YoYPct?: number | null;
  mercadoUpdatedAt?: string | null;
  onRefreshMercado?: () => void;
  refreshingMercado?: boolean;
  mercadoRefreshNote?: string | null;
  className?: string;
}

function PrecioRow({
  label,
  value,
  countLabel,
  yearComparisonPct,
  diffMercadoPct,
}: {
  label: string;
  value: string;
  countLabel: string;
  yearComparisonPct?: number | null;
  diffMercadoPct?: number | null;
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
        {diffMercadoPct != null && (
          <span
            className={cn(
              "text-xs font-medium tabular-nums",
              diffMercadoPct < 0
                ? "text-emerald-700"
                : diffMercadoPct > 0
                  ? "text-amber-700"
                  : "text-muted-foreground"
            )}
          >
            {diffMercadoPct > 0 ? "+" : ""}
            {diffMercadoPct}% vs mercado
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{countLabel}</p>
    </div>
  );
}

function formatEuroM2(value: number | null): string {
  if (value == null) return "—";
  return `${formatEuro(value).replace(/\s*€$/, "")} €/m²`;
}

function MercadoRefCard({
  fuente,
  etiqueta,
  periodo,
  refCompra,
  refVenta,
  nuestroCompra,
  nuestroVenta,
}: {
  fuente: string;
  etiqueta: string | null;
  periodo: string | null;
  refCompra: number | null;
  refVenta: number | null;
  nuestroCompra: number | null;
  nuestroVenta: number | null;
}) {
  const diffCompra = computeDiffPctVsMercado(nuestroCompra, refCompra);
  const diffVenta = computeDiffPctVsMercado(nuestroVenta, refVenta);
  const refPrincipal = refCompra ?? refVenta;
  const nuestroPrincipal = nuestroCompra ?? nuestroVenta;
  const diffPrincipal = diffCompra ?? diffVenta;

  const progressPct =
    refPrincipal != null && nuestroPrincipal != null && refPrincipal > 0
      ? Math.min(100, Math.round((nuestroPrincipal / refPrincipal) * 100))
      : null;

  if (refCompra == null && refVenta == null) return null;

  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {fuente}
      </p>
      <p data-money className="mt-1 text-lg font-semibold tabular-nums">
        {formatEuroM2(refPrincipal)}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {etiqueta ?? "Sin territorio"}
        {periodo ? ` · ${periodo}` : ""}
      </p>

      {progressPct != null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary/80 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {diffPrincipal != null
                ? `${diffPrincipal > 0 ? "+" : ""}${diffPrincipal}% vs ${fuente}`
                : `${progressPct}% del mercado`}
            </span>
            {nuestroPrincipal != null && (
              <span data-money className="tabular-nums">
                {formatEuroM2(nuestroPrincipal)}
              </span>
            )}
          </div>
        </div>
      )}

      {refCompra != null &&
        refVenta != null &&
        refVenta !== refCompra && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            Compra {formatEuroM2(refCompra)} · Venta {formatEuroM2(refVenta)}
          </p>
        )}
    </div>
  );
}

export function PreciosMediosCard({
  preciosMedios,
  yearFilter,
  compraYoYPct,
  ventaYoYPct,
  compraM2YoYPct,
  ventaM2YoYPct,
  mercadoUpdatedAt,
  onRefreshMercado,
  refreshingMercado = false,
  mercadoRefreshNote,
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

  const compraM2CountLabel =
    preciosMedios.comprasConSuperficieVivienda > 0
      ? `${preciosMedios.comprasConSuperficieVivienda} con precio y m² vivienda`
      : "Falta superficie vivienda o precio de compra";

  const ventaM2CountLabel =
    preciosMedios.ventasConSuperficieVivienda > 0
      ? `${preciosMedios.ventasConSuperficieVivienda} con precio y m² vivienda`
      : "Falta superficie vivienda o precio de venta";

  const compraDiffMercado = computeDiffPctVsMercado(
    preciosMedios.euroM2MedioCompra,
    preciosMedios.mercadoEuroM2Compra
  );
  const ventaDiffMercado = computeDiffPctVsMercado(
    preciosMedios.euroM2MedioVenta,
    preciosMedios.mercadoEuroM2Venta
  );

  const hasMercadoRefs =
    preciosMedios.mercadoEuroM2Compra != null ||
    preciosMedios.mercadoEuroM2Venta != null ||
    preciosMedios.idealistaEuroM2Compra != null ||
    preciosMedios.idealistaEuroM2Venta != null;

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

      <div className="my-4 border-t" />

      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        €/m² vivienda
      </p>
      <div className="grid grid-cols-2 gap-4">
        <PrecioRow
          label="Compra"
          value={formatEuroM2(preciosMedios.euroM2MedioCompra)}
          countLabel={compraM2CountLabel}
          yearComparisonPct={compraM2YoYPct}
          diffMercadoPct={compraDiffMercado}
        />
        <PrecioRow
          label="Venta"
          value={formatEuroM2(preciosMedios.euroM2MedioVenta)}
          countLabel={ventaM2CountLabel}
          yearComparisonPct={ventaM2YoYPct}
          diffMercadoPct={ventaDiffMercado}
        />
      </div>

      {hasMercadoRefs && (
        <>
          <div className="my-4 border-t" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">
                Mercado de referencia
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                MITMA (tasación) e Idealista (oferta)
                {mercadoUpdatedAt
                  ? ` · ${formatMercadoUpdatedAt(mercadoUpdatedAt)}`
                  : ""}
              </p>
            </div>
            {onRefreshMercado && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                disabled={refreshingMercado}
                onClick={onRefreshMercado}
              >
                {refreshingMercado ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualizar
              </Button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MercadoRefCard
              fuente="MITMA"
              etiqueta={preciosMedios.mercadoEtiqueta}
              periodo={preciosMedios.mercadoPeriodo}
              refCompra={preciosMedios.mercadoEuroM2Compra}
              refVenta={preciosMedios.mercadoEuroM2Venta}
              nuestroCompra={preciosMedios.euroM2MedioCompra}
              nuestroVenta={preciosMedios.euroM2MedioVenta}
            />
            <MercadoRefCard
              fuente="Idealista"
              etiqueta={preciosMedios.idealistaEtiqueta}
              periodo={preciosMedios.idealistaPeriodo}
              refCompra={preciosMedios.idealistaEuroM2Compra}
              refVenta={preciosMedios.idealistaEuroM2Venta}
              nuestroCompra={preciosMedios.euroM2MedioCompra}
              nuestroVenta={preciosMedios.euroM2MedioVenta}
            />
          </div>

          {mercadoRefreshNote && (
            <p className="mt-3 border-t pt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
              {mercadoRefreshNote}
            </p>
          )}
        </>
      )}
    </div>
  );
}
