import { formatEuro, round2 } from "@/lib/moneyCalc";
import { computeObjetivoProgress } from "@/lib/objetivos";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import type { InformesStats } from "@/lib/informesStats";
import { cn } from "@/lib/utils";

export type BeneficioObjetivoVariant = "neto" | "bruto" | "medio";

interface BeneficioObjetivoCardProps {
  variant: BeneficioObjetivoVariant;
  stats: InformesStats;
  objetivoBeneficioMedio: number | null;
  yearFilter: string;
  yearComparisonPct?: number | null;
  className?: string;
}

const VARIANT_CONFIG = {
  neto: {
    title: "Beneficio neto",
    innerLabel: "Total en vista",
    description: "Suma de ingresos en banco",
  },
  bruto: {
    title: "Beneficio bruto",
    innerLabel: "Total en vista",
    description: "Ingresos en banco + retenciones",
  },
  medio: {
    title: "Beneficio medio",
    innerLabel: "Por operación liquidada",
    description: "Media de ingreso en banco por liquidación",
  },
} as const;

function aggregateObjetivoNeto(
  objetivo: number,
  operaciones: number
): number {
  return round2(objetivo * operaciones);
}

function aggregateObjetivoBruto(
  objetivo: number,
  operaciones: number,
  retencionesLiquidadas: number
): number {
  return round2(objetivo * operaciones + retencionesLiquidadas);
}

export function BeneficioObjetivoCard({
  variant,
  stats,
  objetivoBeneficioMedio,
  yearFilter,
  yearComparisonPct,
  className,
}: BeneficioObjetivoCardProps) {
  const config = VARIANT_CONFIG[variant];
  const {
    beneficioNeto,
    beneficioBruto,
    beneficioMedio,
    operacionesLiquidadas,
    ingresoLiquidadas,
    retencionesLiquidadas,
    brutoLiquidadas,
  } = stats;

  const displayValue =
    variant === "neto"
      ? beneficioNeto
      : variant === "bruto"
        ? beneficioBruto
        : beneficioMedio;

  const hasTarget =
    objetivoBeneficioMedio != null &&
    objetivoBeneficioMedio > 0 &&
    operacionesLiquidadas > 0;

  const progressTarget = hasTarget
    ? variant === "medio"
      ? objetivoBeneficioMedio
      : variant === "neto"
        ? aggregateObjetivoNeto(
            objetivoBeneficioMedio,
            operacionesLiquidadas
          )
        : aggregateObjetivoBruto(
            objetivoBeneficioMedio,
            operacionesLiquidadas,
            retencionesLiquidadas
          )
    : null;

  const progressActual =
    variant === "medio"
      ? beneficioMedio
      : variant === "neto"
        ? ingresoLiquidadas
        : brutoLiquidadas;

  const progress = hasTarget
    ? computeObjetivoProgress(progressActual, progressTarget)
    : { percent: 0, tone: "muted" as const };

  const vistaLabel =
    yearFilter === "all" ? "Todos los ejercicios" : `Ejercicio ${yearFilter}`;

  const opsLabel =
    operacionesLiquidadas === 1
      ? "1 operación liquidada"
      : `${operacionesLiquidadas} operaciones liquidadas`;

  const statusMessage = (() => {
    if (operacionesLiquidadas === 0) {
      return "Sin operaciones liquidadas en esta vista.";
    }
    if (!objetivoBeneficioMedio || objetivoBeneficioMedio <= 0) {
      return "Configura un objetivo de beneficio medio en Ajustes.";
    }
    if (variant === "medio") {
      if (progress.percent >= 100) {
        return "Has alcanzado el objetivo de beneficio medio.";
      }
      return "Aún no has alcanzado el objetivo de beneficio medio.";
    }
    if (variant === "neto") {
      if (progress.percent >= 100) {
        return `Las liquidadas suman ${formatEuro(ingresoLiquidadas)} y alcanzan el objetivo agregado.`;
      }
      return `Las liquidadas aportan ${formatEuro(ingresoLiquidadas)} de ${formatEuro(beneficioNeto)} neto.`;
    }
    if (progress.percent >= 100) {
      return `Bruto liquidado ${formatEuro(brutoLiquidadas)} = neto + ${formatEuro(retencionesLiquidadas)} retenciones. Objetivo alcanzado.`;
    }
    return `Bruto liquidado ${formatEuro(brutoLiquidadas)} = neto + ${formatEuro(retencionesLiquidadas)} retenciones.`;
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
            <p className="font-semibold tracking-tight">{config.title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {vistaLabel}
              {operacionesLiquidadas > 0 ? ` · ${opsLabel}` : ""}
            </p>
          </div>
          {yearComparisonPct != null && (
            <YearOverYearIndicator pct={yearComparisonPct} className="shrink-0" />
          )}
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {config.innerLabel}
          </p>
          <p
            data-money
            className="mt-1 text-3xl font-semibold tabular-nums tracking-tight"
          >
            {displayValue != null ? formatEuro(displayValue) : "—"}
          </p>

          {hasTarget && progressActual != null && progressTarget != null && (
            <>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(progress.percent, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  {variant === "medio"
                    ? `${Math.round(progress.percent)}% del objetivo`
                    : `${Math.round(progress.percent)}% del objetivo agregado`}
                </span>
                <span data-money className="font-medium tabular-nums">
                  {formatEuro(progressTarget)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-auto border-t bg-muted/40 px-5 py-3">
        <p className="text-xs text-muted-foreground">{statusMessage}</p>
      </div>
    </div>
  );
}
