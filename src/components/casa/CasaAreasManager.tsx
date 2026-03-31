// src/components/casa/CasaAreasManager.tsx
// Manages areas (category groups) — accessible from the Categorías page
import { useState, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import {
  type CasaArea,
  type CasaAreaCategoria,
  type CasaCategoria,
} from "@/lib/casaTypes";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

// ─── Types ───────────────────────────────────────────────────

type CatTipo = "gasto" | "ingreso" | "activo";

interface CasaAreasManagerProps {
  initialAreas: CasaArea[];
  initialAssignments: CasaAreaCategoria[];
  gastoCategorias: CasaCategoria[];
  ingresoCategorias: CasaCategoria[];
  activoCategorias: CasaCategoria[];
}

const TIPO_LABELS: Record<CatTipo, string> = {
  gasto: "Gastos",
  ingreso: "Ingresos",
  activo: "Activos",
};

// ─── Component ───────────────────────────────────────────────

export default function CasaAreasManager({
  initialAreas,
  initialAssignments,
  gastoCategorias,
  ingresoCategorias,
  activoCategorias,
}: CasaAreasManagerProps) {
  const [areas, setAreas] = useState<CasaArea[]>(initialAreas);
  const [assignments, setAssignments] = useState<CasaAreaCategoria[]>(initialAssignments);
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<CatTipo>("gasto");

  const catMap: Record<CatTipo, CasaCategoria[]> = {
    gasto: gastoCategorias,
    ingreso: ingresoCategorias,
    activo: activoCategorias,
  };

  // ── Get category IDs assigned to an area ──
  const getAreaCatIds = useCallback(
    (areaId: string): Set<string> => {
      return new Set(
        assignments
          .filter((a) => a.area_id === areaId)
          .map((a) => `${a.tipo}:${a.categoria_id}`)
      );
    },
    [assignments]
  );

  // ── Add area ──
  const addArea = useCallback(async () => {
    try {
      const res = await fetch("/.netlify/functions/createCasaArea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: "Nueva área" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAreas((prev) => [...prev, data]);
      setExpandedArea(data.id);
      toast.success("Área creada");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, []);

  // ── Rename area ──
  const updateName = useCallback(
    async (id: string, nombre: unknown) => {
      const newName = String(nombre ?? "").trim();
      if (!newName) return;

      setAreas((prev) =>
        prev.map((a) => (a.id === id ? { ...a, nombre: newName } : a))
      );

      try {
        const res = await fetch("/.netlify/functions/updateCasaArea", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, nombre: newName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAreas((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...data } : a))
        );
      } catch (e: any) {
        toast.error(e.message || "Error al guardar");
      }
    },
    []
  );

  // ── Delete area ──
  const deleteArea = useCallback(async (id: string) => {
    try {
      const res = await fetch("/.netlify/functions/deleteCasaArea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setAreas((prev) => prev.filter((a) => a.id !== id));
      setAssignments((prev) => prev.filter((a) => a.area_id !== id));
      if (expandedArea === id) setExpandedArea(null);
      toast.success("Área eliminada");
    } catch (e: any) {
      toast.error(e.message || "Error al eliminar");
    }
  }, [expandedArea]);

  // ── Toggle category in area ──
  const toggleCategory = useCallback(
    async (areaId: string, tipo: CatTipo, categoriaId: string, checked: boolean) => {
      // Build new assignments list for this area
      const current = assignments.filter((a) => a.area_id === areaId);
      let updated: { tipo: string; categoria_id: string }[];

      if (checked) {
        updated = [
          ...current.map((a) => ({ tipo: a.tipo, categoria_id: a.categoria_id })),
          { tipo, categoria_id: categoriaId },
        ];
      } else {
        updated = current
          .filter((a) => !(a.tipo === tipo && a.categoria_id === categoriaId))
          .map((a) => ({ tipo: a.tipo, categoria_id: a.categoria_id }));
      }

      // Optimistic update
      const optimistic = [
        ...assignments.filter((a) => a.area_id !== areaId),
        ...updated.map((u, i) => ({
          id: `temp-${areaId}-${i}`,
          area_id: areaId,
          tipo: u.tipo as CatTipo,
          categoria_id: u.categoria_id,
        })),
      ];
      setAssignments(optimistic);

      try {
        const res = await fetch("/.netlify/functions/syncCasaAreaCategorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ area_id: areaId, categorias: updated }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        // Replace with real data
        setAssignments((prev) => [
          ...prev.filter((a) => a.area_id !== areaId),
          ...data,
        ]);
      } catch (e: any) {
        toast.error(e.message || "Error al guardar");
        // Revert
        setAssignments(assignments);
      }
    },
    [assignments]
  );

  // ── Count categories per area ──
  function countCats(areaId: string): number {
    return assignments.filter((a) => a.area_id === areaId).length;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="outline" onClick={addArea}>
          <Plus className="h-4 w-4 mr-1" /> Añadir área
        </Button>
        <span className="text-sm text-muted-foreground">
          {areas.length} {areas.length === 1 ? "área" : "áreas"}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[32px]" />
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[120px]">Categorías</TableHead>
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {areas.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  Sin áreas. Pulsa «Añadir área» para empezar.
                </TableCell>
              </TableRow>
            ) : (
              areas.map((area) => {
                const isExpanded = expandedArea === area.id;
                const catIds = getAreaCatIds(area.id);

                return (
                  <TableRow key={area.id} className="group">
                    {/* Expand toggle */}
                    <TableCell className="p-1">
                      <button
                        type="button"
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted/60"
                        onClick={() =>
                          setExpandedArea(isExpanded ? null : area.id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>

                    {/* Name */}
                    <TableCell className="p-1">
                      {isExpanded ? (
                        <div className="space-y-3">
                          <EditableCell
                            value={area.nombre}
                            type="text"
                            onSave={(v) => updateName(area.id, v)}
                          />

                          {/* Category selector */}
                          <div className="pl-1 space-y-2 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Tipo:
                              </span>
                              <Select
                                value={selectedTipo}
                                onValueChange={(v) =>
                                  setSelectedTipo(v as CatTipo)
                                }
                              >
                                <SelectTrigger className="h-7 w-[120px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(
                                    Object.entries(TIPO_LABELS) as [
                                      CatTipo,
                                      string
                                    ][]
                                  ).map(([val, label]) => (
                                    <SelectItem key={val} value={val}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-1">
                              {catMap[selectedTipo].map((cat) => {
                                const key = `${selectedTipo}:${cat.id}`;
                                const isChecked = catIds.has(key);
                                return (
                                  <label
                                    key={cat.id}
                                    className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/40 cursor-pointer text-sm"
                                  >
                                    <Checkbox
                                      checked={isChecked}
                                      onCheckedChange={(checked) =>
                                        toggleCategory(
                                          area.id,
                                          selectedTipo,
                                          cat.id,
                                          !!checked
                                        )
                                      }
                                    />
                                    {cat.nombre}
                                  </label>
                                );
                              })}
                              {catMap[selectedTipo].length === 0 && (
                                <span className="text-xs text-muted-foreground col-span-2 py-2">
                                  Sin categorías de {TIPO_LABELS[selectedTipo].toLowerCase()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <EditableCell
                          value={area.nombre}
                          type="text"
                          onSave={(v) => updateName(area.id, v)}
                        />
                      )}
                    </TableCell>

                    {/* Count */}
                    <TableCell className="p-1 text-sm text-muted-foreground">
                      {countCats(area.id)}
                    </TableCell>

                    {/* Delete */}
                    <TableCell className="p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: area.id,
                            name: area.nombre,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        title="Eliminar área"
        description={`¿Eliminar "${deleteTarget?.name}"? Las categorías no se eliminan, solo la agrupación.`}
        confirmWord={deleteTarget?.name || ""}
        onConfirm={async () => {
          if (deleteTarget) await deleteArea(deleteTarget.id);
        }}
      />
    </div>
  );
}
