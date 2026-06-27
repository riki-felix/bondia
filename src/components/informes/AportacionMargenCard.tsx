import { formatEuro, round2 } from "@/lib/moneyCalc";
import {
  computeMargenPct,
  computeUsoCapitalMultiple,
} from "@/lib/informesStats";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import { cn } from "@/lib/utils";

interface AportacionMargenCardProps {
  aportacion: number;
  transferenciaTotal: number;
  invertido: number;
  yearFilter: string;
  aportacionYoYPct?: number | null;
  margenYoYPct?: number | null;
  className?: string;
}

function formatMultiplicador(value: number): string {
  const rounded = round2(value);
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1).replace(".", ",");
  return `×${text}`;
}

export function AportacionMargenCard({
  aportacion,
  transferenciaTotal,
  invertido,
  yearFilter,
  aportacionYoYPct,
  margenYoYPct,
  className,
}: AportacionMargenCardProps) {
  const vistaLabel =
    yearFilter === "all" ? "Todos los ejercicios" : `Ejercicio ${yearFilter}`;

  const usoMultiple = computeUsoCapitalMultiple(aportacion, invertido);
  const margen = computeMargenPct(transferenciaTotal, invertido);
  const hasInvertido = invertido > 0;

  const usoBarPct =
    hasInvertido && usoMultiple != null
      ? Math.min(100, round2((aportacion / invertido) * 100))
      : 0;

  const statusMessage = (() => {
    if (!hasInvertido) {
      return "Indica tu capital invertido en la cabecera para medir el uso en aportaciones.";
    }
    if (aportacion <= 0) {
      return "Sin aportaciones en esta vista.";
    }
    if (usoMultiple == null) return "";
    if (usoMultiple < 1) {
      return `Has utilizado el ${Math.round(usoBarPct)}% de tu inversión (${formatEuro(aportacion)} de ${formatEuro(invertido)}).`;
    }
    if (usoMultiple === 1) {
      return `Las aportaciones equivalen a tu inversión (${formatEuro(invertido)}).`;
    }
    return `Has utilizado ${formatMultiplicador(usoMultiple)} tu inversión de ${formatEuro(invertido)} en aportaciones.`;
  })();

  return (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold tracking-tight">Aportación</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{vistaLabel}</p>
          </div>
          {aportacionYoYPct != null && (
            <YearOverYearIndicator pct={aportacionYoYPct} className="shrink-0" />
          )}
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Total aportado
          </p>
          <p
            data-money
            className="mt-1 text-3xl font-semibold tabular-nums tracking-tight"
          >
            {formatEuro(aportacion)}
          </p>

          {hasInvertido && aportacion > 0 && (
            <>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${usoBarPct}%` }}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {usoMultiple != null && usoMultiple >= 1
                    ? `${formatMultiplicador(usoMultiple)} del invertido`
                    : `${Math.round(usoBarPct)}% del invertido`}
                </span>
                <span data-money className="font-medium tabular-nums">
                  {formatEuro(invertido)}
                </span>
              </div>
            </>
          )}

          <div className="mt-4 border-t border-border/60 pt-4">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Margen
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-xl font-semibold tabular-nums">
                {margen != null ? `${margen}%` : "—"}
              </p>
              {margenYoYPct != null && (
                <YearOverYearIndicator pct={margenYoYPct} />
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Transferencias / invertido
              {hasInvertido && transferenciaTotal > 0
                ? ` · ${formatEuro(transferenciaTotal)}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t bg-muted/40 px-5 py-3">
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      </div>
    </div>
  );
}
