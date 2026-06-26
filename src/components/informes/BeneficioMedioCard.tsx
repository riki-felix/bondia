import { formatEuro } from "@/lib/moneyCalc";
import { computeObjetivoProgress } from "@/lib/objetivos";
import { GoalProgressRing } from "@/components/objetivos/GoalProgressRing";
import { YearOverYearIndicator } from "@/components/informes/YearOverYearIndicator";
import { cn } from "@/lib/utils";

interface BeneficioMedioCardProps {
  beneficioMedio: number | null;
  operacionesLiquidadas: number;
  objetivoBeneficioMedio: number | null;
  yearComparisonPct?: number | null;
  className?: string;
}

export function BeneficioMedioCard({
  beneficioMedio,
  operacionesLiquidadas,
  objetivoBeneficioMedio,
  yearComparisonPct,
  className,
}: BeneficioMedioCardProps) {
  const opsLabel =
    operacionesLiquidadas === 1
      ? "1 operación liquidada"
      : `${operacionesLiquidadas} operaciones liquidadas`;

  const hasTarget =
    objetivoBeneficioMedio != null && objetivoBeneficioMedio > 0;
  const progress = hasTarget
    ? computeObjetivoProgress(beneficioMedio, objetivoBeneficioMedio)
    : { percent: 0, tone: "muted" as const };

  const ringLabel = hasTarget
    ? progress.percent >= 100
      ? "100%"
      : `${Math.round(progress.percent)}%`
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4",
        progress.tone === "green" && "border-green-200 bg-green-50/50",
        progress.tone === "yellow" && "border-yellow-200 bg-yellow-50/50",
        progress.tone === "red" && hasTarget && "border-red-200 bg-red-50/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Beneficio medio
        </p>
        {hasTarget && (
          <div className="relative shrink-0 w-[52px] h-[52px]">
            <GoalProgressRing percent={progress.percent} tone={progress.tone} />
            {ringLabel && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums">
                {ringLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p data-money className="text-2xl font-semibold tabular-nums">
          {beneficioMedio != null ? formatEuro(beneficioMedio) : "—"}
        </p>
        {yearComparisonPct != null && (
          <YearOverYearIndicator pct={yearComparisonPct} />
        )}
      </div>
      {hasTarget ? (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Objetivo: {formatEuro(objetivoBeneficioMedio)}
        </p>
      ) : (
        <p className="mt-0.5 text-xs text-muted-foreground">
          Sin objetivo — configúralo en Ajustes
        </p>
      )}
      <p className="mt-0.5 text-xs text-muted-foreground">
        {operacionesLiquidadas > 0
          ? opsLabel
          : "Sin operaciones liquidadas en esta vista"}
      </p>
    </div>
  );
}
