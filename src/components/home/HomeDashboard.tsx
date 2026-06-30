// src/components/home/HomeDashboard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { formatEuro } from "@/lib/money";
import { IngresosBancoWidget } from "@/components/home/IngresosBancoWidget";
import type { IngresoBancoPropiedadRow } from "@/lib/ingresosBancoAggregate";

interface Props {
  ejercicio: number;
  mediaGastosMensual: number;
  mediaAlquilerMensual: number;
  ingresosBancoPropiedades: IngresoBancoPropiedadRow[];
  ingresosBancoYears: number[];
}

const ALQUILER_MEDIO_POR_PISO = 800;

export default function HomeDashboard({
  ejercicio,
  mediaGastosMensual,
  mediaAlquilerMensual,
  ingresosBancoPropiedades,
  ingresosBancoYears,
}: Props) {
  const pct =
    mediaGastosMensual > 0
      ? Math.min((mediaAlquilerMensual / mediaGastosMensual) * 100, 100)
      : 0;
  const pctRaw =
    mediaGastosMensual > 0
      ? Math.round((mediaAlquilerMensual / mediaGastosMensual) * 100)
      : 0;

  // Monthly deficit: how many extra pisos at 800€/month to cover it
  const deficitMensual = mediaGastosMensual - mediaAlquilerMensual;
  const pisosNecesarios =
    deficitMensual > 0 ? Math.ceil(deficitMensual / ALQUILER_MEDIO_POR_PISO) : 0;

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <IngresosBancoWidget
          propiedades={ingresosBancoPropiedades}
          years={ingresosBancoYears}
          defaultYear={currentYear}
        />
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-base font-semibold mb-4">
            Independencia financiera
          </h3>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-4xl font-bold text-primary">
              {pctRaw}%
            </span>
            <span className="text-sm text-muted-foreground">
              alquileres cubren gastos
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-muted/50 overflow-hidden mb-3">
            <div
              className="h-2.5 rounded-full transition-all bg-primary"
              style={{ width: `${pct}%` }}
            />
          </div>

          {pisosNecesarios > 0 ? (
            <p className="text-sm text-muted-foreground">
              Faltan ~{pisosNecesarios} pisos para el 100%
            </p>
          ) : (
            <p className="text-sm font-medium text-green-600">
              ✓ Independencia lograda
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
