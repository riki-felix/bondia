// src/components/bloque/BloqueGastosTable.tsx
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { getSupabase } from "@/lib/supabaseReact";
import { formatEuro, toNum } from "@/lib/moneyCalc";
import {
  type BloqueGasto,
  type BloqueCategoria,
  type BloqueOverride,
  type BloqueArea,
  type BloqueAreaCategoria,
  type MetodoPago,
  type MetodoPagoTipo,
  FRECUENCIA_OPTIONS,
  MESES_LABELS,
  calcularImporteMes,
  buildOverridesMap,
} from "@/lib/bloqueTypes";
import type { BloqueConfig } from "@/lib/bloqueConfig";
import { Plus, Trash2, Layers, List, CreditCard, Banknote, ArrowLeftRight, Wallet, CircleDashed, ArrowUp, ArrowDown, Paperclip } from "lucide-react";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EntityDocumentsDialog } from "@/components/documents/EntityDocumentsDialog";
import type { DocumentBloque } from "@/lib/documentTypes";
import { DateRangePopover } from "./DateRangePopover";
import BloqueCategoryDonut from "./BloqueCategoryDonut";

// ─── Props ───────────────────────────────────────────────────

interface BloqueGastosTableProps {
  config: BloqueConfig;
  initialData: BloqueGasto[];
  initialOverrides: BloqueOverride[];
  categorias: BloqueCategoria[];
  initialYear: number;
  areas?: BloqueArea[];
  areaAssignments?: BloqueAreaCategoria[];
  metodosPago?: MetodoPago[];
  initialCatFilter?: string | null;
}

// ─── Payment method icon map ─────────────────────────────────

const METODO_ICONS: Record<MetodoPagoTipo, typeof CreditCard> = {
  tarjeta: CreditCard,
  efectivo: Banknote,
  transferencia: ArrowLeftRight,
  paypal: Wallet,
};

// ─── Component ───────────────────────────────────────────────

export default function BloqueGastosTable({
  config,
  initialData,
  initialOverrides,
  categorias,
  initialYear,
  areas = [],
  areaAssignments = [],
  metodosPago = [],
  initialCatFilter = null,
}: BloqueGastosTableProps) {
  const [rows, setRows] = useState<BloqueGasto[]>(initialData);
  const [overrides, setOverrides] = useState<BloqueOverride[]>(initialOverrides);
  const [ejercicio, setEjercicio] = useState<number>(initialYear);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [docsTarget, setDocsTarget] = useState<{ id: string; name: string } | null>(null);
  const bloque = config.id as DocumentBloque;
  const [activeArea, setActiveArea] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(initialCatFilter);
  const [viewMode, setViewMode] = useState<"detalle" | "categorias">("detalle");
  const [conceptSort, setConceptSort] = useState<"asc" | "desc" | null>(() => {
    if (typeof window === "undefined") return null;
    const sort = new URLSearchParams(window.location.search).get("sortConcepto");
    return sort === "asc" || sort === "desc" ? sort : null;
  });

  // Build set of categoria_ids for active area filter (gastos only)
  const areaCatIds = useMemo(() => {
    if (!activeArea) return null;
    return new Set(
      areaAssignments
        .filter((a) => a.area_id === activeArea && a.tipo === "gasto")
        .map((a) => a.categoria_id)
    );
  }, [activeArea, areaAssignments]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let result = rows;
    if (areaCatIds) {
      result = result.filter((r) => r.categoria_id && areaCatIds.has(r.categoria_id));
    }
    if (activeCat) {
      result = result.filter((r) => r.categoria_id === activeCat);
    }
    return result;
  }, [rows, areaCatIds, activeCat]);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const opts: number[] = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) opts.push(y);
    return opts;
  }, [currentYear]);

  const overridesMap = useMemo(
    () => buildOverridesMap(overrides, "gasto_id"),
    [overrides]
  );

  const categoriaOptions = useMemo(
    () => [
      { value: "__none__", label: "Sin categoría" },
      ...categorias.map((c) => ({ value: c.id, label: c.nombre })),
    ],
    [categorias]
  );

  // ── Year change → reload ──
  const changeYear = useCallback(async (year: string) => {
    const y = Number(year);
    setEjercicio(y);
    try {
      const supabase = getSupabase();
      const [gastos, ovr] = await Promise.all([
        supabase
          .from(config.tables.gastos)
          .select(`*, ${config.joins.gastosCateg}`)
          .eq("ejercicio", y)
          .order("created_at", { ascending: true }),
        supabase
          .from(config.tables.gastosOverrides)
          .select("*")
          .eq("ejercicio", y),
      ]);

      setRows(
        (gastos.data ?? []).map((r: any) => ({
          ...r,
          categoria_nombre: r[config.tables.gastosCateg]?.nombre ?? "",
        }))
      );
      setOverrides(ovr.data ?? []);
    } catch (e) {
      toast.error("Error cargando datos");
    }
  }, [config]);

  // ── Add row ──
  const addRow = useCallback(async () => {
    try {
      const res = await fetch(config.endpoints.createGasto, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: "",
          frecuencia: "mensual",
          importe: 0,
          ejercicio,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRows((prev) => [data, ...prev]);
      toast.success("Fila añadida");
    } catch (e: any) {
      toast.error(e.message || "Error al crear");
    }
  }, [ejercicio, config]);

  const toggleConceptSort = useCallback(() => {
    setConceptSort((prev) => {
      if (prev === null) return "asc";
      if (prev === "asc") return "desc";
      return null;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (conceptSort) {
      url.searchParams.set("sortConcepto", conceptSort);
    } else {
      url.searchParams.delete("sortConcepto");
    }

    window.history.replaceState({}, "", url.toString());
  }, [conceptSort]);

  // ── Update field ──
  const updateField = useCallback(
    async (id: string, field: string, value: unknown) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );

      try {
        const res = await fetch(config.endpoints.updateGasto, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, [field]: value }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        // Merge server response
        setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
      } catch (e: any) {
        toast.error(e.message || "Error al guardar");
        // Revert will happen on next reload
        changeYear(String(ejercicio));
      }
    },
    [ejercicio, changeYear, config]
  );

  // ── Update monthly cell ──
  const updateOverride = useCallback(
    async (itemId: string, mes: number, value: unknown) => {
      const importe = toNum(value);
      const row = rows.find((r) => r.id === itemId);

      // Set base importe when it's a new row (importe === 0) with a recurring frequency
      if (
        row &&
        row.importe === 0 &&
        row.frecuencia !== "variable"
      ) {
        // Clear any stale overrides for this item so the base takes effect everywhere
        setOverrides((prev) =>
          prev.filter((o) => !(o.gasto_id === itemId && o.ejercicio === ejercicio))
        );
        return updateField(itemId, "importe", importe);
      }

      // Optimistic
      const key = `${itemId}-${mes}`;
      setOverrides((prev) => {
        const existing = prev.find(
          (o) => o.gasto_id === itemId && o.mes === mes && o.ejercicio === ejercicio
        );
        if (existing) {
          return prev.map((o) =>
            o.id === existing.id ? { ...o, importe } : o
          );
        }
        return [
          ...prev,
          { id: `temp-${key}`, gasto_id: itemId, ejercicio, mes, importe },
        ];
      });

      try {
        const res = await fetch(config.endpoints.upsertOverride, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "gasto",
            item_id: itemId,
            ejercicio,
            mes,
            importe,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        // Replace temp with real
        setOverrides((prev) =>
          prev.map((o) =>
            (o.gasto_id === itemId && o.mes === mes && o.ejercicio === ejercicio)
              ? { ...data, gasto_id: data.gasto_id }
              : o
          )
        );
      } catch (e: any) {
        toast.error(e.message || "Error al guardar celda");
        changeYear(String(ejercicio));
      }
    },
    [ejercicio, changeYear, rows, updateField, config]
  );

  // ── Delete row ──
  const deleteRow = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(config.endpoints.deleteGasto, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        setRows((prev) => prev.filter((r) => r.id !== id));
        setOverrides((prev) => prev.filter((o) => o.gasto_id !== id));
        toast.success("Eliminado");
      } catch (e: any) {
        toast.error(e.message || "Error al eliminar");
      }
    },
    [config]
  );

  // ── Compute totals ──
  const monthTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    for (const row of filteredRows) {
      for (let m = 1; m <= 12; m++) {
        const val = calcularImporteMes(row, m, ejercicio, overridesMap);
        totals[m - 1] += val ?? 0;
      }
    }
    return totals;
  }, [filteredRows, ejercicio, overridesMap]);

  const grandTotal = useMemo(
    () => monthTotals.reduce((a, b) => a + b, 0),
    [monthTotals]
  );

  // ── Row total ──
  function rowTotal(row: BloqueGasto): number {
    let sum = 0;
    for (let m = 1; m <= 12; m++) {
      sum += calcularImporteMes(row, m, ejercicio, overridesMap) ?? 0;
    }
    return sum;
  }

  // ── Category-grouped rows ──
  type CategoryRow = { catId: string; catName: string; months: number[]; total: number };
  const categoryRows = useMemo<CategoryRow[]>(() => {
    const map = new Map<string, { catName: string; months: number[] }>();
    for (const row of filteredRows) {
      const catId = row.categoria_id ?? "__none__";
      const catName = row.categoria_nombre || "Sin categoría";
      if (!map.has(catId)) {
        map.set(catId, { catName, months: Array(12).fill(0) });
      }
      const entry = map.get(catId)!;
      for (let m = 1; m <= 12; m++) {
        entry.months[m - 1] += calcularImporteMes(row, m, ejercicio, overridesMap) ?? 0;
      }
    }
    return Array.from(map.entries())
      .map(([catId, { catName, months }]) => ({
        catId,
        catName,
        months,
        total: months.reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredRows, ejercicio, overridesMap]);

  // Visible rows for rendering
  const visibleRows = useMemo(() => {
    if (conceptSort === null) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      const left = String(a.concepto ?? "").trim();
      const right = String(b.concepto ?? "").trim();
      const leftEmpty = left.length === 0;
      const rightEmpty = right.length === 0;

      // Keep empty concepts pinned at the top so newly created rows stay visible.
      if (leftEmpty !== rightEmpty) return leftEmpty ? -1 : 1;
      if (leftEmpty && rightEmpty) return 0;

      const cmp = left.localeCompare(right, "es", { sensitivity: "base" });

      if (cmp !== 0) return conceptSort === "asc" ? cmp : -cmp;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [filteredRows, conceptSort]);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3">
        <Select value={String(ejercicio)} onValueChange={changeYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-1" /> Añadir gasto
        </Button>

        {/* View mode toggle */}
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              viewMode === "detalle"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setViewMode("detalle")}
          >
            <List className="h-3.5 w-3.5" /> Detalle
          </button>
          <button
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              viewMode === "categorias"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setViewMode("categorias")}
          >
            <Layers className="h-3.5 w-3.5" /> Categorías
          </button>
        </div>

        {/* Area filters – only areas with gasto assignments */}
        {areas.filter((a) => areaAssignments.some((aa) => aa.area_id === a.id && aa.tipo === "gasto")).length > 0 && (
          <div className="flex items-center gap-1 ml-2 border-l pl-3">
            <span className="text-xs text-muted-foreground mr-1">Área:</span>
            {areas.filter((a) => areaAssignments.some((aa) => aa.area_id === a.id && aa.tipo === "gasto")).map((area) => (
              <Button
                key={area.id}
                size="sm"
                variant={activeArea === area.id ? "default" : "outline"}
                className="h-7 text-xs px-2"
                onClick={() =>
                  setActiveArea(activeArea === area.id ? null : area.id)
                }
              >
                {area.nombre}
              </Button>
            ))}
            {activeArea && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs px-2"
                onClick={() => setActiveArea(null)}
              >
                ✕
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Donut ── */}
      {categoryRows.length > 0 && (
        <BloqueCategoryDonut
          data={categoryRows.map((c) => ({ id: c.catId, name: c.catName, value: c.total }))}
          label="Total anual"
        />
      )}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[140px]">Categoría</TableHead>
              {viewMode === "detalle" && (
                <>
                  <TableHead className="w-[200px]">
                    <button
                      type="button"
                      onClick={toggleConceptSort}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      title="Ordenar por concepto"
                    >
                      <span>Concepto</span>
                      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
                        <ArrowUp
                          className={`h-3 w-3 ${
                            conceptSort === "asc" ? "text-foreground" : "text-muted-foreground"
                          }`}
                        />
                        <ArrowDown
                          className={`h-3 w-3 ${
                            conceptSort === "desc" ? "text-foreground" : "text-muted-foreground"
                          }`}
                        />
                      </span>
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px]">Frecuencia</TableHead>
                  {metodosPago.length > 0 && (
                    <TableHead className="w-[44px]" title="Método de pago">
                      <CreditCard className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
                    </TableHead>
                  )}
                </>
              )}
              {MESES_LABELS.map((m) => (
                <TableHead key={m} className="text-right w-[90px]">
                  {m}
                </TableHead>
              ))}
              <TableHead className="text-right w-[100px] font-bold">
                TOTAL
              </TableHead>
              {viewMode === "detalle" && <TableHead className="w-[40px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewMode === "categorias" ? (
              /* ── Category view ── */
              categoryRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className="text-center text-muted-foreground py-8"
                  >
                    Sin gastos para {ejercicio}.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {categoryRows.map((cat) => (
                    <TableRow key={cat.catId}>
                      <TableCell className="p-1 text-sm font-medium">
                        {cat.catName}
                      </TableCell>
                      {cat.months.map((v, i) => (
                        <TableCell
                          key={i}
                          className="p-1 text-right tabular-nums text-sm"
                        >
                          {v ? formatEuro(v) : ""}
                        </TableCell>
                      ))}
                      <TableCell className="p-1 text-right tabular-nums text-sm font-semibold">
                        {formatEuro(cat.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="p-1 text-right">TOTAL</TableCell>
                    {monthTotals.map((t, i) => (
                      <TableCell
                        key={i}
                        className="p-1 text-right tabular-nums text-sm"
                      >
                        {formatEuro(t)}
                      </TableCell>
                    ))}
                    <TableCell className="p-1 text-right tabular-nums text-sm font-bold">
                      {formatEuro(grandTotal)}
                    </TableCell>
                  </TableRow>
                </>
              )
            ) : (
              /* ── Detail view ── */
              <>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={metodosPago.length > 0 ? 17 : 16}
                  className="text-center text-muted-foreground py-8"
                >
                  {activeArea
                    ? `Sin gastos en esta área para ${ejercicio}.`
                    : `Sin gastos para ${ejercicio}. Pulsa «Añadir gasto» para empezar.`}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
                <TableRow key={row.id}>
                  {/* Categoría */}
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

                  {/* Concepto + Duración */}
                  <TableCell className="p-1">
                    <div className="flex items-center gap-1">
                      <DateRangePopover
                        fechaInicio={row.fecha_inicio}
                        fechaFin={row.fecha_fin}
                        onSave={(inicio, fin) => {
                          updateField(row.id, "fecha_inicio", inicio);
                          updateField(row.id, "fecha_fin", fin);
                        }}
                      />
                      <EditableCell
                        value={row.concepto}
                        type="text"
                        className="flex-1 min-w-[140px]"
                        onSave={(v) => updateField(row.id, "concepto", v)}
                      />
                    </div>
                  </TableCell>

                  {/* Frecuencia */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={row.frecuencia}
                      type="select"
                      options={FRECUENCIA_OPTIONS}
                      onSave={(v) => updateField(row.id, "frecuencia", v)}
                    />
                  </TableCell>

                  {/* Método de pago (icon-only) */}
                  {metodosPago.length > 0 && (
                    <TableCell className="p-1">
                      <Select
                        value={row.metodo_pago_id ?? "__none__"}
                        onValueChange={(v) =>
                          updateField(
                            row.id,
                            "metodo_pago_id",
                            v === "__none__" ? null : v
                          )
                        }
                      >
                        <SelectTrigger className="h-7 w-9 px-0 justify-center border-0 bg-transparent shadow-none [&>svg:last-child]:hidden">
                          {(() => {
                            const mp = metodosPago.find((m) => m.id === row.metodo_pago_id);
                            if (mp) {
                              const Icon = METODO_ICONS[mp.tipo];
                              return <Icon className="h-3.5 w-3.5 text-foreground" />;
                            }
                            return <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/40" />;
                          })()}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <div className="flex items-center gap-2">
                              <CircleDashed className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs">Sin método</span>
                            </div>
                          </SelectItem>
                          {metodosPago.map((mp) => {
                            const Icon = METODO_ICONS[mp.tipo];
                            return (
                              <SelectItem key={mp.id} value={mp.id}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-3.5 w-3.5" />
                                  <span className="text-xs">{mp.nombre}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}

                  {/* Month cells */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => {
                    const val = calcularImporteMes(
                      row,
                      mes,
                      ejercicio,
                      overridesMap
                    );
                    return (
                      <TableCell key={mes} className="p-1">
                        <EditableCell
                          value={val}
                          type="money"
                          onSave={(v) => updateOverride(row.id, mes, v)}
                        />
                      </TableCell>
                    );
                  })}

                  {/* Row total */}
                  <TableCell className="p-1">
                    <EditableCell
                      value={rowTotal(row)}
                      type="readonly-money"
                      onSave={() => {}}
                      className="font-semibold"
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="p-1">
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground"
                        title="Documentos"
                        onClick={() =>
                          setDocsTarget({
                            id: row.id,
                            name: row.concepto || "Gasto",
                          })
                        }
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: row.id,
                            name: row.concepto || "este gasto",
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

            {/* ── Totals row ── */}
            {visibleRows.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={metodosPago.length > 0 ? 4 : 3} className="p-1 text-right">
                  TOTAL
                </TableCell>
                {monthTotals.map((t, i) => (
                  <TableCell
                    key={i}
                    className="p-1 text-right tabular-nums text-sm"
                  >
                    {formatEuro(t)}
                  </TableCell>
                ))}
                <TableCell className="p-1 text-right tabular-nums text-sm font-bold">
                  {formatEuro(grandTotal)}
                </TableCell>
                <TableCell />
              </TableRow>
            )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {docsTarget && (
        <EntityDocumentsDialog
          open={!!docsTarget}
          onOpenChange={(open) => !open && setDocsTarget(null)}
          bloque={bloque}
          entityType="gasto"
          entityId={docsTarget.id}
          entityLabel={docsTarget.name}
        />
      )}

      {/* ── Delete dialog ── */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar gasto"
        description={`¿Eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmWord={deleteTarget?.name || ""}
        onConfirm={async () => {
          if (deleteTarget) await deleteRow(deleteTarget.id);
        }}
      />
    </div>
  );
}
