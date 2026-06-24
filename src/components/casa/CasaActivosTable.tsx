// src/components/casa/CasaActivosTable.tsx
import { useState, useCallback, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuro } from "@/lib/moneyCalc";
import { type CasaActivo, type CasaCategoria } from "@/lib/casaTypes";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

// ─── Props ───────────────────────────────────────────────────

interface CasaActivosTableProps {
  initialData: CasaActivo[];
  categorias: CasaCategoria[];
}

// ─── Component ───────────────────────────────────────────────

export default function CasaActivosTable({
  initialData,
  categorias,
}: CasaActivosTableProps) {
  const [rows, setRows] = useState<CasaActivo[]>(initialData);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const categoriaOptions = useMemo(
    () => [
      { value: "__none__", label: "Sin categoría" },
      ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
    ],
    [categorias]
  );

  // ── Add row ──
  const addRow = useCallback(async () => {
    try {
      const res = await fetch("/.netlify/functions/createCasaActivo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows((prev) => [data, ...prev]);
      toast.success("Activo añadido");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, []);

  // ── Update field ──
  const updateField = useCallback(
    async (id: string, field: string, value: unknown) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );

      try {
        const res = await fetch("/.netlify/functions/updateCasaActivo", {
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
    []
  );

  // ── Delete row ──
  const deleteRow = useCallback(async (id: string) => {
    try {
      const res = await fetch("/.netlify/functions/deleteCasaActivo", {
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
  }, []);

  // ── Total patrimonio ──
  const totalPatrimonio = useMemo(
    () => rows.reduce((sum, r) => sum + (r.precio_compra ?? 0), 0),
    [rows]
  );

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {rows.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Total patrimonio: <strong>{formatEuro(totalPatrimonio)}</strong>
          </span>
        )}
        <div className="ml-auto shrink-0">
          <Button onClick={addRow}>
            <Plus className="h-4 w-4" />
            Añadir activo
          </Button>
        </div>
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
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
