// src/components/bloque/BloqueCategoriasManager.tsx
import { useState, useCallback } from "react";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { type BloqueCategoria } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { Plus, Trash2 } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

// ─── Types ───────────────────────────────────────────────────

type CatTipo = "gasto" | "ingreso" | "activo";

interface BloqueCategoriasManagerProps {
  config: BloqueConfig;
  gastoCategorias: BloqueCategoria[];
  ingresoCategorias: BloqueCategoria[];
  activoCategorias: BloqueCategoria[];
}

// ─── Sub-table for one category type ─────────────────────────

function CategoriaTable({
  config,
  tipo,
  categorias: initialCategorias,
  label,
}: {
  config: BloqueConfig;
  tipo: CatTipo;
  categorias: BloqueCategoria[];
  label: string;
}) {
  const [rows, setRows] = useState<BloqueCategoria[]>(initialCategorias);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const addRow = useCallback(async () => {
    try {
      const res = await fetch(config.endpoints.createCategoria, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nombre: `Nueva categoría` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows((prev) => [...prev, data]);
      toast.success("Categoría añadida");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, [tipo, config]);

  const updateName = useCallback(
    async (id: string, nombre: unknown) => {
      const newName = String(nombre ?? "").trim();
      if (!newName) return;

      // Optimistic
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, nombre: newName } : r))
      );

      try {
        const res = await fetch(config.endpoints.updateCategoria, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, id, nombre: newName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data } : r))
        );
      } catch (e: any) {
        toast.error(e.message || "Error al guardar");
      }
    },
    [tipo, config]
  );

  const deleteRow = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(config.endpoints.deleteCategoria, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo, id }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        setRows((prev) => prev.filter((r) => r.id !== id));
        toast.success("Categoría eliminada");
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar");
      }
    },
    [tipo, config]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Añadir categoría
        </Button>
        <span className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "categoría" : "categorías"}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground py-8"
                >
                  Sin categorías de {label.toLowerCase()}. Pulsa «Añadir
                  categoría» para empezar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.nombre}
                      type="text"
                      onSave={(v) => updateName(row.id, v)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setDeleteTarget({ id: row.id, name: row.nombre })
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
        title="Eliminar categoría"
        description={`¿Eliminar "${deleteTarget?.name}"? Los elementos que usen esta categoría quedarán sin categoría asignada.`}
        confirmWord={deleteTarget?.name || ""}
        onConfirm={async () => {
          if (deleteTarget) await deleteRow(deleteTarget.id);
        }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export default function BloqueCategoriasManager({
  config,
  gastoCategorias,
  ingresoCategorias,
  activoCategorias,
}: BloqueCategoriasManagerProps) {
  return (
    <Tabs defaultValue="gasto" className="w-full">
      <TabsList>
        <TabsTrigger value="gasto">Gastos</TabsTrigger>
        <TabsTrigger value="ingreso">Ingresos</TabsTrigger>
        <TabsTrigger value="activo">Activos</TabsTrigger>
      </TabsList>

      <TabsContent value="gasto">
        <CategoriaTable
          config={config}
          tipo="gasto"
          categorias={gastoCategorias}
          label="Gastos"
        />
      </TabsContent>

      <TabsContent value="ingreso">
        <CategoriaTable
          config={config}
          tipo="ingreso"
          categorias={ingresoCategorias}
          label="Ingresos"
        />
      </TabsContent>

      <TabsContent value="activo">
        <CategoriaTable
          config={config}
          tipo="activo"
          categorias={activoCategorias}
          label="Activos"
        />
      </TabsContent>
    </Tabs>
  );
}
