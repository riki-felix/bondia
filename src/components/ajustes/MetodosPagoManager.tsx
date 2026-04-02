// src/components/ajustes/MetodosPagoManager.tsx
import { useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { Trash2, Plus, CreditCard, Banknote, ArrowLeftRight, Wallet } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { MetodoPago, MetodoPagoTipo, MetodoPagoAlcance } from "@/lib/bloqueTypes";
import { METODO_TIPO_OPTIONS, METODO_ALCANCE_OPTIONS } from "@/lib/bloqueTypes";

interface Props {
  initialData: MetodoPago[];
}

const TIPO_ICONS: Record<MetodoPagoTipo, typeof CreditCard> = {
  tarjeta: CreditCard,
  efectivo: Banknote,
  transferencia: ArrowLeftRight,
  paypal: Wallet,
};

export default function MetodosPagoManager({ initialData }: Props) {
  const [rows, setRows] = useState<MetodoPago[]>(initialData);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const addRow = useCallback(async () => {
    try {
      const res = await fetch("/.netlify/functions/createMetodoPago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Nuevo método", tipo: "tarjeta", alcance: "ambos" }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || "Error al crear");
      setRows((prev) => [...prev, data]);
      toast.success("Método de pago añadido");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, []);

  const updateField = useCallback(
    async (id: string, field: string, value: unknown) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
      try {
        const res = await fetch("/.netlify/functions/updateMetodoPago", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, [field]: value }),
        });
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(data.error || "Error al guardar");
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
      } catch (e: any) {
        toast.error(e.message || "Error al guardar");
      }
    },
    []
  );

  const deleteRow = useCallback(async (id: string) => {
    try {
      const res = await fetch("/.netlify/functions/deleteMetodoPago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        throw new Error(data.error || "Error al eliminar");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Método eliminado");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Métodos de pago</CardTitle>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" />
          Añadir
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin métodos de pago. Pulsa «Añadir» para crear uno.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const Icon = TIPO_ICONS[row.tipo];
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0" />

                  {/* Nombre */}
                  <Input
                    className="h-8 text-sm flex-1 min-w-[120px]"
                    defaultValue={row.nombre}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== row.nombre) updateField(row.id, "nombre", v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                  />

                  {/* Tipo */}
                  <Select
                    value={row.tipo}
                    onValueChange={(v) => updateField(row.id, "tipo", v)}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METODO_TIPO_OPTIONS.map((o) => {
                        const TIcon = TIPO_ICONS[o.value];
                        return (
                          <SelectItem key={o.value} value={o.value}>
                            <div className="flex items-center gap-2">
                              <TIcon className="h-3.5 w-3.5" />
                              {o.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {/* Alcance */}
                  <Select
                    value={row.alcance}
                    onValueChange={(v) => updateField(row.id, "alcance", v)}
                  >
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METODO_ALCANCE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Activo toggle */}
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={row.activo}
                      onCheckedChange={(v) => updateField(row.id, "activo", v)}
                      className="scale-75"
                    />
                    <span className="text-[11px] text-muted-foreground w-[38px]">
                      {row.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() =>
                      setDeleteTarget({ id: row.id, name: row.nombre })
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Eliminar método de pago"
          description={`¿Eliminar "${deleteTarget?.name}"? Los gastos asociados perderán este método.`}
          confirmWord={deleteTarget?.name || ""}
          onConfirm={async () => {
            if (deleteTarget) await deleteRow(deleteTarget.id);
          }}
        />
      </CardContent>
    </Card>
  );
}
