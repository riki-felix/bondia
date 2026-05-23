import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import type { BloqueActivoMovimientosPayload } from "@/lib/fetchActivoMovimientos";
import BloqueGastosTable from "./BloqueGastosTable";
import BloqueIngresosTable from "./BloqueIngresosTable";

interface BloqueActivoMovimientosProps {
  config: BloqueConfig;
  activoId: string;
  activoNombre: string;
  data: BloqueActivoMovimientosPayload;
}

export function BloqueActivoMovimientos({
  config,
  activoId,
  activoNombre,
  data,
}: BloqueActivoMovimientosProps) {
  const [showGastos, setShowGastos] = useState(
    () => data.linkedGastosCount > 0 || data.gastos.length > 0
  );
  const [showIngresos, setShowIngresos] = useState(
    () => data.linkedIngresosCount > 0 || data.ingresos.length > 0
  );

  const onGastosCount = useCallback((count: number) => {
    if (count > 0) setShowGastos(true);
    else if (data.linkedGastosCount === 0) setShowGastos(false);
  }, [data.linkedGastosCount]);

  const onIngresosCount = useCallback((count: number) => {
    if (count > 0) setShowIngresos(true);
    else if (data.linkedIngresosCount === 0) setShowIngresos(false);
  }, [data.linkedIngresosCount]);

  const gastosHref = `${config.routes.gastos}?activo=${activoId}&year=${data.ejercicio}`;
  const ingresosHref = `${config.routes.ingresos}?activo=${activoId}&year=${data.ejercicio}`;

  return (
    <div className="space-y-6">
      {showGastos && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Gastos vinculados</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Gastos asociados a «{activoNombre}»
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={gastosHref}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver en Gastos
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <BloqueGastosTable
              config={config}
              initialData={data.gastos}
              initialOverrides={data.gastosOverrides}
              categorias={data.gastosCategorias}
              initialYear={data.ejercicio}
              areas={data.areas}
              areaAssignments={data.areaAssignments}
              metodosPago={data.metodosPago}
              activos={data.activos}
              lockedActivoId={activoId}
              embedMode
              onRowsCountChange={onGastosCount}
            />
          </CardContent>
        </Card>
      )}

      {showIngresos && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
            <div>
              <CardTitle className="text-base">Ingresos vinculados</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ingresos asociados a «{activoNombre}»
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={ingresosHref}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Ver en Ingresos
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <BloqueIngresosTable
              config={config}
              initialData={data.ingresos}
              initialOverrides={data.ingresosOverrides}
              categorias={data.ingresosCategorias}
              initialYear={data.ejercicio}
              areas={data.areas}
              areaAssignments={data.areaAssignments}
              activos={data.activos}
              lockedActivoId={activoId}
              embedMode
              onRowsCountChange={onIngresosCount}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
