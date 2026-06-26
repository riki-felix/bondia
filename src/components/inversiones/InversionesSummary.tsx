import { StatCard } from "@/components/ui/stat-card";
import { formatEuro } from "@/lib/moneyCalc";
import { computeObjetivoProgress } from "@/lib/objetivos";
import type { InversionesSummaryStats } from "@/lib/inversionesSummaryStats";
import { GoalProgressRing } from "@/components/objetivos/GoalProgressRing";
import { cn } from "@/lib/utils";

interface InversionesSummaryProps {
  stats: InversionesSummaryStats;
  objetivoBeneficioMedio: number | null;
}

function BeneficioMedioWidget({
  stats,
  objetivoBeneficioMedio,
}: InversionesSummaryProps) {
  const opsLabel =
    stats.operacionesLiquidadas === 1
      ? "1 operación liquidada"
      : `${stats.operacionesLiquidadas} operaciones liquidadas`;

  const actual = stats.beneficioMedio;
  const hasTarget = objetivoBeneficioMedio != null && objetivoBeneficioMedio > 0;
  const progress = hasTarget
    ? computeObjetivoProgress(actual, objetivoBeneficioMedio)
    : { percent: 0, tone: "muted" as const };

  const ringLabel = hasTarget
    ? progress.percent >= 100
      ? "100%"
      : `${Math.round(progress.percent)}%`
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 bg-muted/40 col-span-2 lg:col-span-1",
        progress.tone === "green" && "border-green-200 bg-green-50/50",
        progress.tone === "yellow" && "border-yellow-200 bg-yellow-50/50",
        progress.tone === "red" && hasTarget && "border-red-200 bg-red-50/40"
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
      <p data-money className="mt-1 text-2xl font-semibold tabular-nums">
        {actual != null ? formatEuro(actual) : "—"}
      </p>
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
        {stats.operacionesLiquidadas > 0
          ? opsLabel
          : "Sin operaciones liquidadas en esta vista"}
      </p>
    </div>
  );
}

export function InversionesSummary({
  stats,
  objetivoBeneficioMedio,
}: InversionesSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard
        label="Aportación total"
        value={formatEuro(stats.aportacionTotal)}
        description="Suma de aportaciones"
        variant="highlight"
      />
      <StatCard
        label="Beneficio neto"
        value={formatEuro(stats.beneficioNeto)}
        description="Suma de ingresos en banco"
      />
      <StatCard
        label="Beneficio bruto"
        value={formatEuro(stats.beneficioBruto)}
        description="Ingresos en banco + retenciones"
      />
      <StatCard
        label="Retribución total"
        value={formatEuro(stats.retribucionTotal)}
        description="Suma de retribuciones"
      />
      <BeneficioMedioWidget
        stats={stats}
        objetivoBeneficioMedio={objetivoBeneficioMedio}
      />
    </div>
  );
}
