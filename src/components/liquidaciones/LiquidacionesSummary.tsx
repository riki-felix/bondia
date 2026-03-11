import { StatCard } from "@/components/ui/stat-card";
import { formatEuro } from "@/lib/moneyCalc";

interface LiquidacionesSummaryProps {
  totalTransferencia: number;
  totalEfectivo: number;
}

export function LiquidacionesSummary({
  totalTransferencia,
  totalEfectivo,
}: LiquidacionesSummaryProps) {
  const diferencia = totalTransferencia - totalEfectivo;
  const total = totalTransferencia + totalEfectivo;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard
        label="Total Transferencias"
        value={formatEuro(totalTransferencia)}
        description="Suma de todas las transferencias"
        variant="highlight"
      />
      <StatCard
        label="Total Efectivo"
        value={formatEuro(totalEfectivo)}
        description="Suma de todo el efectivo"
      />
      <StatCard
        label="Transferencias − Efectivo"
        value={formatEuro(diferencia)}
        description="Diferencia"
        variant="muted"
      />
      <StatCard
        label="Total Final"
        value={formatEuro(total)}
        description="Transferencias + Efectivo"
      />
    </div>
  );
}
