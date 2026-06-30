import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEuro } from "@/lib/moneyCalc";
import type { Property } from "@/lib/propertyTypes";
import {
  effectiveBeneficioBruto,
  jaspBreakdownForProperty,
} from "@/lib/inversionOperativa";
import { MasterLiquidacionDocumentsPanel } from "@/components/documents/MasterLiquidacionDocumentsPanel";

interface LiquidarOperacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property | null;
  onConfirm: (payload: {
    fecha_liquidacion: string;
    numero_op_liquidacion: number | null;
  }) => Promise<void>;
}

export function LiquidarOperacionDialog({
  open,
  onOpenChange,
  property,
  onConfirm,
}: LiquidarOperacionDialogProps) {
  const [fechaLiquidacion, setFechaLiquidacion] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [numeroOp, setNumeroOp] = useState("");
  const [saving, setSaving] = useState(false);

  if (!property) return null;

  const bruto = effectiveBeneficioBruto(property);
  const jasp = jaspBreakdownForProperty(property);

  const handleOpen = (next: boolean) => {
    if (next && property) {
      setFechaLiquidacion(
        property.fecha_liquidacion?.slice(0, 10) ??
          new Date().toISOString().slice(0, 10)
      );
      setNumeroOp(
        property.numero_op_liquidacion != null
          ? String(property.numero_op_liquidacion)
          : ""
      );
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm({
        fecha_liquidacion: fechaLiquidacion,
        numero_op_liquidacion: numeroOp.trim() ? Number(numeroOp) : null,
      });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Liquidar operación</DialogTitle>
          <DialogDescription>
            Cierre definitivo JASP para{" "}
            <span className="font-medium">{property.titulo}</span>. Los importes
            financieros quedarán bloqueados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-lg border bg-muted/40 p-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bruto</span>
              <span data-money className="font-medium tabular-nums">
                {formatEuro(bruto)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">JASP contable</span>
              <span data-money className="font-medium tabular-nums">
                {formatEuro(jasp.jaspContable)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">JASP real / neto</span>
              <span data-money className="font-medium tabular-nums">
                {formatEuro(jasp.jaspReal)} / {formatEuro(jasp.neto)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Dar por cobrado JASP</span>
              <span data-money className="tabular-nums">
                {formatEuro(jasp.darPorCobrado)}
              </span>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div>
              <Label className="text-sm">Master de liquidación</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                PDF recomendado. Puedes subirlo aquí o liquidar sin él.
              </p>
            </div>
            <MasterLiquidacionDocumentsPanel
              bloque="engine"
              entityType="propiedad"
              entityId={property.id}
              compact
            />
          </div>

          <div className="grid gap-3">
            <div>
              <Label htmlFor="fecha-liquidacion">Fecha liquidación</Label>
              <Input
                id="fecha-liquidacion"
                type="date"
                value={fechaLiquidacion}
                onChange={(e) => setFechaLiquidacion(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="numero-op-liq">Nº OP liquidación (JASP)</Label>
              <Input
                id="numero-op-liq"
                inputMode="numeric"
                placeholder="Opcional"
                value={numeroOp}
                onChange={(e) => setNumeroOp(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !fechaLiquidacion}>
            {saving ? "Liquidando…" : "Confirmar liquidación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
