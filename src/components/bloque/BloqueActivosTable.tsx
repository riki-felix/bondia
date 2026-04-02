// src/components/bloque/BloqueActivosTable.tsx
import { useState, useCallback, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuro } from "@/lib/moneyCalc";
import { type BloqueActivo, type BloqueCategoria } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { Plus, Trash2, Pencil } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

// ─── Props ───────────────────────────────────────────────────

interface BloqueActivosTableProps {
  config: BloqueConfig;
  initialData: BloqueActivo[];
  categorias: BloqueCategoria[];
}

// ─── Component ───────────────────────────────────────────────

export default function BloqueActivosTable({
  config,
  initialData,
  categorias,
}: BloqueActivosTableProps) {
  const [rows, setRows] = useState<BloqueActivo[]>(initialData);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const categoriaOptions = useMemo(
    () => [
      { value: "__none__", label: "Sin categoría" },
      ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
    ],
    [categorias]
  );

  // ── Update field ──
  const updateField = useCallback(
    async (id: string, field: string, value: unknown) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );

      try {
        const res = await fetch(config.endpoints.updateActivo, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, [field]: value }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
      } catch (e: any) {
        toast.error(e.message || "Error al guardar");
      }
    },
    [config]
  );

  // ── Delete row ──
  const deleteRow = useCallback(async (id: string) => {
    try {
      const res = await fetch(config.endpoints.deleteActivo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Eliminado");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }, [config]);

  // ── Total patrimonio ──
  const totalPatrimonio = useMemo(
    () => rows.reduce((sum, r) => sum + (r.precio_compra ?? 0), 0),
    [rows]
  );

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" asChild>
          <a href={config.routes.activoNuevo}>
            <Plus className="h-4 w-4 mr-1" /> Añadir activo
          </a>
        </Button>
        {rows.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Total patrimonio: <strong>{formatEuro(totalPatrimonio)}</strong>
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre</TableHead>
              <TableHead className="w-[180px]">Categoría</TableHead>
              <TableHead className="w-[150px]">Fecha compra</TableHead>
              <TableHead className="text-right w-[150px]">Precio compra</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Sin activos registrados. Pulsa «Añadir activo» para empezar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.nombre}
                      type="text"
                      onSave={(v) => updateField(row.id, "nombre", v)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.categoria_id ?? "__none__"}
                      type="select"
                      options={categoriaOptions}
                      onSave={(v) =>
                        updateField(
                          row.id,
                          "categoria_id",
                          v === "__none__" ? null : v
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.fecha_compra}
                      type="date"
                      onSave={(v) => updateField(row.id, "fecha_compra", v)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.precio_compra}
                      type="money"
                      onSave={(v) => updateField(row.id, "precio_compra", v)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        asChild
                      >
                        <a href={`${config.routes.activoDetalle}/${row.id}`}>
                          <Pencil className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: row.id,
                            name: row.nombre || "este activo",
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar activo"
        description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmWord={deleteTarget?.name || ""}
        onConfirm={async () => {
          if (deleteTarget) await deleteRow(deleteTarget.id);
        }}
      />
    </div>
  );
}
