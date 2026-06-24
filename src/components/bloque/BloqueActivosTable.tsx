// src/components/bloque/BloqueActivosTable.tsx
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuro } from "@/lib/moneyCalc";
import { type BloqueActivo, type BloqueCategoria, type ActivoTag } from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { bloqueHasActivoInmuebles, bloqueHasActivoTitular } from "@/lib/bloqueConfig";
import {
  CASA_ACTIVO_TITULAR_OPTIONS,
  type CasaActivoTitular,
  isCasaActivoTitular,
} from "@/lib/casaActivoTitular";
import { Plus, Trash2, Pencil } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import BloqueCategoryDonut from "./BloqueCategoryDonut";
import {
  findInmueblesCategoriaId,
  isActivoInmueble,
  isInmueblesCategoria,
  matchesActivosCatFilter,
  resolveActivosCatFilter,
} from "@/lib/sanyusInmueblePlantilla";

// ─── Props ───────────────────────────────────────────────────

interface BloqueActivosTableProps {
  config: BloqueConfig;
  initialData: BloqueActivo[];
  categorias: BloqueCategoria[];
  initialCatFilter?: string | null;
  allTags?: ActivoTag[];
  initialTagFilter?: string | string[] | null;
  initialTitularFilter?: CasaActivoTitular | null;
}

// ─── Component ───────────────────────────────────────────────

export default function BloqueActivosTable({
  config,
  initialData,
  categorias,
  initialCatFilter = null,
  allTags = [],
  initialTagFilter = null,
  initialTitularFilter = null,
}: BloqueActivosTableProps) {
  const hasInmuebles = bloqueHasActivoInmuebles(config);
  const hasTitular = bloqueHasActivoTitular(config);
  const inmueblesCategoriaId = useMemo(
    () => findInmueblesCategoriaId(categorias),
    [categorias]
  );
  const resolvedInitialCat = useMemo(
    () => resolveActivosCatFilter(initialCatFilter, categorias),
    [initialCatFilter, categorias]
  );
  const [rows, setRows] = useState<BloqueActivo[]>(initialData);
  const [activeCat, setActiveCat] = useState<string | null>(resolvedInitialCat);
  const [activeTitular, setActiveTitular] = useState<CasaActivoTitular | null>(
    initialTitularFilter
  );
  const showTitularColumn = hasTitular && activeTitular === "comun";
  const [activeTags, setActiveTags] = useState<string[]>(() => {
    if (!initialTagFilter) return [];
    return Array.isArray(initialTagFilter) ? initialTagFilter : [initialTagFilter];
  });
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const rowsBeforeCatFilter = useMemo(() => {
    let result = rows;
    if (activeTitular) result = result.filter((r) => r.titular === activeTitular);
    return result;
  }, [rows, activeTitular]);

  const visibleCategorias = useMemo(() => {
    const catIds = new Set<string>();
    let hasUncategorized = false;
    for (const row of rowsBeforeCatFilter) {
      if (isActivoInmueble(row, categorias)) {
        if (inmueblesCategoriaId) catIds.add(inmueblesCategoriaId);
      } else if (row.categoria_id) {
        catIds.add(row.categoria_id);
      } else {
        hasUncategorized = true;
      }
    }
    const items: { id: string; nombre: string }[] = [];
    for (const cat of categorias) {
      if (catIds.has(cat.id)) items.push({ id: cat.id, nombre: cat.nombre });
    }
    if (hasUncategorized) {
      items.push({ id: "__none__", nombre: "Sin categoría" });
    }
    return items;
  }, [categorias, rowsBeforeCatFilter, inmueblesCategoriaId]);

  const rowsBeforeTagFilter = useMemo(() => {
    if (!activeCat) return rowsBeforeCatFilter;
    return rowsBeforeCatFilter.filter((r) =>
      matchesActivosCatFilter(r, activeCat, categorias)
    );
  }, [rowsBeforeCatFilter, activeCat, categorias]);

  const visibleTags = useMemo(() => {
    const tagIds = new Set<string>();
    for (const row of rowsBeforeTagFilter) {
      for (const tag of row.tags ?? []) tagIds.add(tag.id);
    }
    return allTags.filter((tag) => tagIds.has(tag.id));
  }, [allTags, rowsBeforeTagFilter]);

  useEffect(() => {
    setActiveTags((prev) => {
      const visibleIds = new Set(visibleTags.map((t) => t.id));
      const next = prev.filter((id) => visibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [visibleTags]);

  useEffect(() => {
    if (!activeCat) return;
    const valid =
      activeCat === "__none__" ||
      visibleCategorias.some((c) => c.id === activeCat);
    if (!valid) setActiveCat(null);
  }, [activeCat, visibleCategorias]);

  const filteredRows = useMemo(() => {
    let result = rowsBeforeTagFilter;
    if (activeTags.length > 0)
      result = result.filter((r) => {
        const rowTagIds = (r.tags ?? []).map((t) => t.id);
        return activeTags.every((tid) => rowTagIds.includes(tid));
      });
    return result;
  }, [rowsBeforeTagFilter, activeTags]);

  const titularOptions = useMemo(
    () => CASA_ACTIVO_TITULAR_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    []
  );

  const toggleCatFilter = useCallback((catId: string) => {
    setActiveCat((prev) => {
      const next = prev === catId ? null : catId;
      const url = new URL(window.location.href);
      url.searchParams.delete("inmueble");
      if (next) {
        let catParam = next;
        if (inmueblesCategoriaId && next === inmueblesCategoriaId) {
          catParam = "inmuebles";
        } else if (next === "__none__") {
          catParam = "__none__";
        }
        url.searchParams.set("cat", catParam);
      } else {
        url.searchParams.delete("cat");
      }
      window.history.replaceState({}, "", url.toString());
      return next;
    });
  }, [inmueblesCategoriaId]);

  const categoriaOptions = useMemo(
    () => [
      { value: "__none__", label: "Sin categoría" },
      ...categorias
        .filter((c) => !isInmueblesCategoria(c))
        .map((c) => ({ value: c.id, label: c.nombre })),
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
  const totalCompra = useMemo(
    () => rows.reduce((sum, r) => sum + (r.precio_compra ?? 0), 0),
    [rows]
  );

  const totalEstimado = useMemo(
    () => rows.reduce((sum, r) => sum + (r.valor_estimado ?? 0), 0),
    [rows]
  );

  // ── Category aggregation for donut ──
  const categoryDonutData = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    for (const row of rows) {
      const catId = row.categoria_id ?? "__none__";
      const catName = row.categoria_nombre || "Sin categoría";
      const value = row.precio_compra ?? 0;
      if (!map.has(catId)) map.set(catId, { name: catName, value: 0 });
      map.get(catId)!.value += value;
    }
    return Array.from(map.entries())
      .map(([id, { name, value }]) => ({ id, name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  const nuevoActivoHref = useMemo(() => {
    if (!hasTitular || !activeTitular) return config.routes.activoNuevo;
    return `${config.routes.activoNuevo}?titular=${activeTitular}`;
  }, [config.routes.activoNuevo, hasTitular, activeTitular]);

  const tableColCount =
    6 + (allTags.length > 0 ? 1 : 0) + (showTitularColumn ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {visibleCategorias.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {visibleCategorias.map((cat) => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCat === cat.id ? "default" : "outline"}
                className="h-7 text-xs px-2"
                onClick={() => toggleCatFilter(cat.id)}
              >
                {cat.nombre}
              </Button>
            ))}
            {activeCat && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2"
                onClick={() => toggleCatFilter(activeCat)}
              >
                ✕
              </Button>
            )}
          </div>
        )}
        {visibleTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {visibleTags.map((tag) => {
              const selected = activeTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium transition-opacity border"
                  style={{
                    backgroundColor: selected ? tag.color + "20" : "transparent",
                    borderColor: selected ? tag.color : "hsl(var(--border))",
                    color: selected ? tag.color : "hsl(var(--muted-foreground))",
                    opacity: activeTags.length > 0 && !selected ? 0.5 : 1,
                  }}
                  onClick={() =>
                    setActiveTags((prev) =>
                      selected
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id]
                    )
                  }
                >
                  {tag.nombre}
                </button>
              );
            })}
          </div>
        )}
        {filteredRows.length > 0 && (
          <span className="text-sm text-muted-foreground">
            Coste: <strong>{formatEuro(totalCompra)}</strong>
            {totalEstimado > 0 && <> · Estimado: <strong>{formatEuro(totalEstimado)}</strong></>}
          </span>
        )}
        <div className="ml-auto shrink-0">
          <Button asChild>
            <a href={nuevoActivoHref}>
              <Plus className="h-4 w-4" />
              Añadir activo
            </a>
          </Button>
        </div>
      </div>

      {/* ── Donut ── */}
      {categoryDonutData.length > 0 && (
        <BloqueCategoryDonut
          data={categoryDonutData}
          label="Coste total"
          showMensual={false}
        />
      )}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nombre</TableHead>
              {showTitularColumn && <TableHead className="w-[120px]">Titular</TableHead>}
              <TableHead className="w-[180px]">Categoría</TableHead>
              {allTags.length > 0 && <TableHead className="w-[150px]">Tags</TableHead>}
              <TableHead className="w-[150px]">Fecha compra</TableHead>
              <TableHead className="text-right w-[150px]">Precio compra</TableHead>
              <TableHead className="text-right w-[150px]">Valor estimado</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={tableColCount}
                  className="text-center text-muted-foreground py-8"
                >
                  Sin activos registrados. Pulsa «Añadir activo» para empezar.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.nombre}
                      type="text"
                      onSave={(v) => updateField(row.id, "nombre", v)}
                    />
                  </TableCell>
                  {showTitularColumn && (
                    <TableCell className="p-1">
                      <EditableCell
                        value={row.titular ?? "carlos"}
                        type="select"
                        options={titularOptions}
                        onSave={(v) => {
                          if (!isCasaActivoTitular(String(v))) return;
                          updateField(row.id, "titular", v);
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell className="p-1">
                    {isActivoInmueble(row, categorias) ? (
                      <span className="text-sm px-2 text-muted-foreground">
                        {row.categoria_nombre ||
                          categorias.find((c) => c.id === inmueblesCategoriaId)?.nombre ||
                          "Inmueble"}
                      </span>
                    ) : (
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
                    )}
                  </TableCell>
                  {allTags.length > 0 && (
                    <TableCell className="p-1">
                      <div className="flex flex-wrap gap-1">
                        {(row.tags ?? []).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: tag.color + "20",
                              color: tag.color,
                            }}
                          >
                            {tag.nombre}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                  )}
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
                    <EditableCell
                      value={row.valor_estimado}
                      type="money"
                      onSave={(v) => updateField(row.id, "valor_estimado", v)}
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
