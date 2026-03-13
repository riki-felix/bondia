import { useState, useEffect } from "react";
import { StatCard } from "@/components/ui/stat-card";
import { Input } from "@/components/ui/input";
import { formatEuro, toNum } from "@/lib/moneyCalc";
import { Pencil } from "lucide-react";

interface LiquidacionesSummaryProps {
  totalTransferencia: number;
  totalEfectivo: number;
  totalAportacion: number;
}

const INVERTIDO_KEY = "bondia_invertido";

export function LiquidacionesSummary({
  totalTransferencia,
  totalEfectivo,
  totalAportacion,
}: LiquidacionesSummaryProps) {
  const diferencia = totalTransferencia - totalEfectivo;
  const total = totalTransferencia + totalEfectivo;

  const [invertido, setInvertido] = useState<number>(0);
  const [editingInvertido, setEditingInvertido] = useState(false);
  const [invertidoInput, setInvertidoInput] = useState("");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(INVERTIDO_KEY);
    if (saved != null) setInvertido(Number(saved) || 0);
  }, []);

  const sobrante = totalAportacion - invertido;
  const margen = invertido > 0 ? Math.round((totalTransferencia / invertido) * 100) : null;

  const handleInvertidoSave = () => {
    const val = toNum(invertidoInput);
    setInvertido(val);
    localStorage.setItem(INVERTIDO_KEY, String(val));
    setEditingInvertido(false);
  };

  return (
    <div className="space-y-4">
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

      {/* ── Aportado / Invertido / Sobrante ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Aportado"
          value={formatEuro(totalAportacion)}
          description="Suma de todas las aportaciones"
          variant="highlight"
        />
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            Invertido
            <Pencil className="h-3 w-3" />
          </p>
          {editingInvertido ? (
            <Input
              autoFocus
              className="mt-1 h-9 text-lg font-semibold tabular-nums"
              value={invertidoInput}
              onChange={(e) => setInvertidoInput(e.target.value)}
              onBlur={handleInvertidoSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleInvertidoSave();
                if (e.key === "Escape") setEditingInvertido(false);
              }}
            />
          ) : (
            <p
              data-money
              className="mt-1 text-2xl font-semibold tabular-nums cursor-pointer hover:text-primary transition-colors"
              onClick={() => {
                setInvertidoInput(invertido ? String(invertido) : "");
                setEditingInvertido(true);
              }}
            >
              {formatEuro(invertido)}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Clic para editar
          </p>
        </div>
        <StatCard
          label="Sobrante"
          value={formatEuro(sobrante)}
          description="Aportado − Invertido"
          variant="muted"
        />
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Margen
          </p>
          <p data-money className="mt-1 text-2xl font-semibold tabular-nums">
            {margen != null ? `${margen}%` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Transferencias / Invertido
          </p>
        </div>
      </div>
    </div>
  );
}
