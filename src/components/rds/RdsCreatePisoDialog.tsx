import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { saveRdsPiso } from "@/lib/rdsApi";

interface RdsCreatePisoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RdsCreatePisoDialog({
  open,
  onOpenChange,
}: RdsCreatePisoDialogProps) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  const reset = useCallback(() => {
    setNombre("");
    setDireccion("");
    setFecha(new Date().toISOString().slice(0, 10));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSubmitting(true);
    try {
      await saveRdsPiso({
        nombre: nombre.trim(),
        direccion: direccion.trim() || null,
        fecha_creacion: fecha,
      });
      toast.success("Piso creado");
      onOpenChange(false);
      reset();
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el piso");
    } finally {
      setSubmitting(false);
    }
  }, [nombre, direccion, fecha, onOpenChange, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo piso RDS</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="rds-nombre">Nombre</Label>
            <Input
              id="rds-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Piso Gran Vía 12"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rds-direccion">Dirección</Label>
            <Input
              id="rds-direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rds-fecha">Fecha de creación</Label>
            <Input
              id="rds-fecha"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
