// src/components/bloque/BloqueActivoCaracteristicasManager.tsx
import { useState, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import type { ActivoCaracteristica, BloqueCategoria } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { bloqueHasActivoInmuebles } from "@/lib/bloqueConfig";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface Props {
  config: BloqueConfig;
  initialCaracteristicas: ActivoCaracteristica[];
  activoCategorias: BloqueCategoria[];
}

export default function BloqueActivoCaracteristicasManager({
  config,
  initialCaracteristicas,
  activoCategorias,
}: Props) {
  const createCaracteristica = config.endpoints.createCaracteristica;
  const updateCaracteristica = config.endpoints.updateCaracteristica;
  const deleteCaracteristica = config.endpoints.deleteCaracteristica;
  if (!createCaracteristica || !updateCaracteristica || !deleteCaracteristica) return null;

  const hasInmuebles = bloqueHasActivoInmuebles(config);

  const [items, setItems] = useState<ActivoCaracteristica[]>(initialCaracteristicas);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const add = useCallback(async () => {
    try {
      const res = await fetch(createCaracteristica, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Nueva característica" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => [...prev, data]);
      toast.success("Característica creada");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, [config]);

  const updateName = useCallback(async (id: string, nombre: unknown) => {
    const newName = String(nombre ?? "").trim();
    if (!newName) return;

    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, nombre: newName } : c)));

    try {
      const res = await fetch(updateCaracteristica, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, nombre: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
  }, [config]);

  const updateCategoria = useCallback(async (id: string, categoria_id: string | null) => {
    setItems((prev) => prev.map((c) => (c.id === id ? { ...c, categoria_id } : c)));

    try {
      const res = await fetch(updateCaracteristica, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, categoria_id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast.error(e.message || "Error al guardar categoría");
    }
  }, [config]);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const res = await fetch(deleteCaracteristica, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setItems((prev) => prev.filter((c) => c.id !== id));
      toast.success("Característica eliminada");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }, [config]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Añadir característica
        </Button>
        <span className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "característica" : "características"}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[200px]">Categoría de activo</TableHead>
              {hasInmuebles && <TableHead className="w-[140px]">Tipo</TableHead>}
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hasInmuebles ? 4 : 3} className="text-center text-muted-foreground py-8">
                  Sin características. Pulsa «Añadir característica» para empezar.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isPlantilla = item.plantilla_inmueble === true;
                return (
                <TableRow key={item.id}>
                  <TableCell className="p-1">
                    {isPlantilla ? (
                      <span className="text-sm px-2 py-1">{item.nombre}</span>
                    ) : (
                      <EditableCell
                        value={item.nombre}
                        type="text"
                        onSave={(v) => updateName(item.id, v)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="p-1">
                    {isPlantilla ? (
                      <span className="text-xs text-muted-foreground px-2">Todas</span>
                    ) : (
                      <Select
                        value={item.categoria_id ?? "__all__"}
                        onValueChange={(v) =>
                          updateCategoria(item.id, v === "__all__" ? null : v)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todas las categorías</SelectItem>
                          {activoCategorias.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  {hasInmuebles && (
                    <TableCell className="p-1">
                      {isPlantilla && (
                        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Plantilla inmueble
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="p-1">
                    {!isPlantilla && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget({ id: item.id, name: item.nombre })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteItem(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title="Eliminar característica"
        description={`¿Seguro que quieres eliminar «${deleteTarget?.name}»? Se borrarán todos los valores asociados.`}
        confirmWord={deleteTarget?.name ?? ""}
      />
    </div>
  );
}
