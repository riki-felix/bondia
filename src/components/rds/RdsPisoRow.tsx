import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EditableCell } from "@/components/inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuro } from "@/lib/money";
import { saveRdsPiso } from "@/lib/rdsApi";
import type { RdsMovimiento, RdsPiso, RdsPisoResumen } from "@/lib/rdsTypes";
import { RdsPisoMovimientosGrid } from "./RdsPisoMovimientosGrid";

interface RdsPisoRowProps {
  piso: RdsPiso;
  movimientos: RdsMovimiento[];
  selectedYear: number;
  initialResumen: RdsPisoResumen;
  tieneDatos: boolean;
  onMovimientoSaved: (mes: number, gasto: number, ingreso: number) => void;
  onPisoUpdated: (piso: RdsPiso) => void;
  onPisoDeleted: (pisoId: string) => void;
}

export function RdsPisoRow({
  piso: initialPiso,
  movimientos,
  selectedYear,
  initialResumen,
  tieneDatos,
  onMovimientoSaved,
  onPisoUpdated,
  onPisoDeleted,
}: RdsPisoRowProps) {
  const [piso, setPiso] = useState(initialPiso);
  const [resumen, setResumen] = useState(initialResumen);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    setPiso(initialPiso);
  }, [initialPiso]);

  useEffect(() => {
    setResumen(initialResumen);
  }, [initialResumen, selectedYear]);

  const updatePisoField = useCallback(
    async (field: "nombre" | "direccion", value: string) => {
      const trimmed = value.trim();
      const prev = piso[field] ?? "";
      const nextValue = field === "nombre" ? trimmed : trimmed || null;

      if (field === "nombre" && !trimmed) {
        toast.error("El nombre es obligatorio");
        return;
      }
      if (
        (field === "nombre" ? prev : prev || "") ===
        (field === "nombre" ? trimmed : trimmed || "")
      ) {
        return;
      }

      const snapshot = piso;
      const optimistic = { ...piso, [field]: nextValue };
      setPiso(optimistic);

      try {
        await saveRdsPiso({
          id: piso.id,
          nombre: field === "nombre" ? trimmed : piso.nombre,
          direccion: field === "direccion" ? (trimmed || null) : piso.direccion,
        });
        onPisoUpdated(optimistic);
      } catch (e) {
        setPiso(snapshot);
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    },
    [piso, onPisoUpdated]
  );

  const handleDelete = useCallback(async () => {
    await saveRdsPiso({ id: piso.id, nombre: piso.nombre, delete: true });
    toast.success("Piso eliminado");
    onPisoDeleted(piso.id);
  }, [piso.id, piso.nombre, onPisoDeleted]);

  return (
    <Collapsible>
      <div className="rounded-lg border">
        <div className="flex flex-wrap items-center gap-3 p-3">
          <CollapsibleTrigger className="group flex shrink-0 items-center hover:opacity-80">
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <div
            className="min-w-0 flex-1 space-y-0.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <EditableCell
              value={piso.nombre}
              type="text"
              className="font-medium"
              onSave={(v) => void updatePisoField("nombre", v as string)}
            />
            <EditableCell
              value={piso.direccion ?? ""}
              type="text"
              className="text-xs text-muted-foreground"
              onSave={(v) => void updatePisoField("direccion", v as string)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm tabular-nums">
            <span data-money className="text-muted-foreground">
              G {formatEuro(resumen.gastos)}
            </span>
            <span data-money className="text-muted-foreground">
              I {formatEuro(resumen.ingresos)}
            </span>
            <span data-money className="font-semibold">
              {formatEuro(resumen.beneficio)}
            </span>
            {!tieneDatos && (
              <span className="text-xs text-muted-foreground">
                sin movimientos en {selectedYear}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Borrar piso"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t px-3 pb-3 pt-2 overflow-x-auto">
            <p className="mb-2 text-xs text-muted-foreground">
              Clic en una celda para editar; se guarda al salir del campo.
            </p>
            <RdsPisoMovimientosGrid
              pisoId={piso.id}
              movimientos={movimientos}
              selectedYear={selectedYear}
              onResumenChange={setResumen}
              onSaved={onMovimientoSaved}
            />
          </div>
        </CollapsibleContent>
      </div>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Borrar piso RDS"
        description={`Se eliminará "${piso.nombre}" y todos sus movimientos. Esta acción no se puede deshacer.`}
        confirmWord="borrar"
        onConfirm={handleDelete}
      />
    </Collapsible>
  );
}
