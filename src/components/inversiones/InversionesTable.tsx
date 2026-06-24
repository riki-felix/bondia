// src/components/inversiones/InversionesTable.tsx
import { useState, useCallback, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EditableCell } from "./EditableCell";
import { toast } from "@/components/ui/sonner";
import { getSupabase } from "@/lib/supabaseReact";
import {
  calcRetencion,
  recalcPropertyEfectivo,
  formatEuro,
  sumColumn,
  toNum,
} from "@/lib/moneyCalc";
import { syncPropiedadFromLiquidaciones } from "@/lib/syncPropiedadFromLiquidaciones";
import {
  type Property,
  PROPERTY_SELECT,
  ESTADO_OPTIONS,
  OCUPADO_OPTIONS,
  derivePagoFromIngreso,
} from "@/lib/propertyTypes";
import { Plus, Archive, Trash2, Pencil, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PropertyDialog } from "./PropertyDialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  effectiveIngresoBancoPropiedad,
  sumTransferenciasLiquidaciones,
  type IngresoBancoLiquidacionRow,
} from "@/lib/ingresosBancoAggregate";
import {
  fetchInversionesWithLiquidaciones,
  propertyEjercicio,
  propertyIsLiquidada,
} from "@/lib/fetchInversionesWithLiquidaciones";
import { TableColumnHeader } from "@/components/ui/table-column-header";
import {
  getEngineColumnTooltip,
  type InversionesColumnKey,
} from "@/lib/engineTableColumnTooltips";

const invTooltip = (column: InversionesColumnKey) =>
  getEngineColumnTooltip("inversiones", column);

// ─── Props ───────────────────────────────────────────────────

interface InversionesTableProps {
  initialData: Property[];
  years: number[];
  initialYear: number | null;
  /** Todas las liquidaciones (para total global = /liquidaciones) */
  liquidacionesTransferencias: IngresoBancoLiquidacionRow[];
}

// ─── Main Component ──────────────────────────────────────────

export default function InversionesTable({
  initialData,
  years,
  initialYear,
  liquidacionesTransferencias,
}: InversionesTableProps) {
  const [rows, setRows] = useState<Property[]>(initialData);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(false);
  const [showLiquidadas, setShowLiquidadas] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [yearFilter, setYearFilter] = useState<string>(
    initialYear != null ? String(initialYear) : "all"
  );

  // Continuous year range from oldest year in data to current year
  const ejercicioOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = years.length > 0 ? Math.min(...years) : currentYear;
    const opts: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= minYear; y--) {
      opts.push({ value: String(y), label: String(y) });
    }
    return opts;
  }, [years]);

  // ── Filtering ──
  const isDraft = (r: Property) => r.estado === "borrador";

  const liquidadasCount = useMemo(
    () => rows.filter((r) => propertyIsLiquidada(r)).length,
    [rows]
  );

  const filteredRows = useMemo(() => {
    let result = rows;

    // Solo activos: hide borradores when filter is on
    if (onlyActive) {
      result = result.filter((r) => !isDraft(r));
    }

    // Liquidadas filter
    if (showLiquidadas) {
      result = result.filter((r) => propertyIsLiquidada(r));
    }

    // Year filter (ejercicio manda desde liquidación)
    if (yearFilter !== "all") {
      const y = Number(yearFilter);
      result = result.filter((r) => {
        const ej = propertyEjercicio(r);
        if (ej != null) return ej === y;
        // Fallback to fecha_ingreso/created_at
        const dateStr = r.fecha_ingreso || r.created_at;
        if (!dateStr) return false;
        return new Date(dateStr).getFullYear() === y;
      });
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.titulo?.toLowerCase().includes(q) ||
          r.estado?.toLowerCase().includes(q) ||
          String(r.numero_operacion ?? "").includes(q) ||
          r.notas?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [rows, yearFilter, search, onlyActive, showLiquidadas]);

  // ── Totals (borradores never count) ──
  const totals = useMemo(() => {
    const nonDraftRows = filteredRows.filter((r) => !isDraft(r));
    const moneyFields = [
      "aportacion",
      "retribucion",
      "retencion",
      "efectivo",
      "jasp_10_percent",
    ] as const;
    const result: Record<string, number> = {};
    for (const f of moneyFields) {
      result[f] = sumColumn(nonDraftRows as unknown as Record<string, unknown>[], f);
    }
    const { total: transferenciaTotal } = sumTransferenciasLiquidaciones(
      liquidacionesTransferencias,
      yearFilter
    );
    result.ingreso_banco = transferenciaTotal;
    return result;
  }, [filteredRows, liquidacionesTransferencias, yearFilter]);

  // ── Save single field ──
  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, [field]: value };

          // Borradores nunca tienen numero_operacion
          if (field === "estado" && value === "borrador") {
            updated.numero_operacion = null;
          }

          if (field === "ingreso_banco") {
            const ingreso = toNum(value);
            const calc = recalcPropertyEfectivo({
              retribucion: toNum(updated.retribucion),
              ingreso_banco: ingreso,
            });
            Object.assign(updated, calc);
            updated.pago = derivePagoFromIngreso(ingreso);
          }

          if (field === "jasp_10_percent") {
            updated.jasp_10_percent = toNum(value);
            updated.jasp_manual = true;
          }

          if (field === "__jasp_auto__") {
            updated.jasp_manual = false;
          }

          return updated;
        })
      );

      // Build the update payload
      const payload: Record<string, unknown> = {};

      if (field === "__jasp_auto__") {
        payload.jasp_manual = false;
      } else if (field === "jasp_10_percent") {
        payload.jasp_10_percent = value;
        payload.jasp_manual = true;
      } else if (field === "ingreso_banco") {
        const ingreso = value == null || value === "" ? null : toNum(value);
        payload.ingreso_banco = ingreso;
        payload.pago = derivePagoFromIngreso(ingreso);
      } else {
        payload[field] = value;
      }

      // Borradores nunca tienen numero_operacion
      if (field === "estado" && value === "borrador") {
        payload.numero_operacion = null;
      }

      // retencion/efectivo: columnas generadas en BD; no enviar

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("propiedades")
          .update(payload)
          .eq("id", id);

        if (error) throw new Error(error.message || error.code || "Error desconocido de Supabase");

        if (field === "__jasp_auto__") {
          const row = rows.find((r) => r.id === id);
          if (row) {
            await syncPropiedadFromLiquidaciones(getSupabase(), id);
            const { data: fresh } = await getSupabase()
              .from("propiedades")
              .select("jasp_10_percent, jasp_manual, retribucion, retencion, efectivo")
              .eq("id", id)
              .single();
            if (fresh) {
              setRows((prev) =>
                prev.map((r) => (r.id === id ? { ...r, ...fresh } : r))
              );
            }
          }
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al guardar";
        console.error("[saveField]", field, value, message);
        toast.error(message);
        // Revert on failure
        setRows((prev) =>
          prev.map((r) => {
            if (r.id !== id) return r;
            const original = initialData.find((o) => o.id === id);
            return original ? { ...original } : r;
          })
        );
      }
    },
    [rows, initialData]
  );

  // ── Reload after creation ──
  const reloadData = useCallback(async () => {
    try {
      const fresh = await fetchInversionesWithLiquidaciones(getSupabase());
      setRows(fresh);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al recargar";
      toast.error(message);
    }
  }, []);

  // ── Delete property ──
  const deleteProperty = useCallback(async () => {
    if (!deleteTarget) return;
    const res = await fetch("/.netlify/functions/deleteProperty", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al eliminar");
    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success("Propiedad eliminada");
  }, [deleteTarget]);

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por título, estado, notas…"
          className="max-w-xs h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Año" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant={onlyActive ? "default" : "outline"}
          onClick={() => setOnlyActive((v) => !v)}
        >
          <Archive className="h-4 w-4 mr-1" />
          Solo activos
        </Button>
        <Button
          size="sm"
          variant={showLiquidadas ? "default" : "outline"}
          onClick={() => setShowLiquidadas((v) => !v)}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          Con Liquidación{liquidadasCount > 0 ? ` (${liquidadasCount})` : ""}
        </Button>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { setEditId(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva propiedad
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border overflow-auto max-h-[80vh] [&_[data-slot=table-wrapper]]:overflow-visible">
        <Table>
          <TableHeader className="sticky top-0 z-20">
            <TableRow className="bg-muted">
              <TableColumnHeader
                className="min-w-[50px] max-w-[50px] sticky left-0 z-30 bg-muted"
                label="ID"
                tooltip={invTooltip("id")}
              />
              <TableColumnHeader
                className="w-[70px]"
                label="AÑO"
                tooltip={invTooltip("anio")}
              />
              <TableColumnHeader
                className="min-w-[200px] sticky left-[50px] z-30 bg-muted shadow-[4px_0_4px_-4px_rgba(0,0,0,0.15)]"
                label="NOMBRE"
                tooltip={invTooltip("nombre")}
              />
              <TableColumnHeader
                className="w-[110px]"
                label="ESTADO"
                tooltip={invTooltip("estado")}
              />
              <TableColumnHeader
                className="w-[120px]"
                label="FECHA INICIO"
                tooltip={invTooltip("fecha_inicio")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="APORTACIÓN"
                tooltip={invTooltip("aportacion")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="RETRIBUCIÓN"
                tooltip={invTooltip("retribucion")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="RETENCIÓN"
                tooltip={invTooltip("retencion")}
              />
              <TableColumnHeader
                className="w-[130px] text-right bg-yellow-50"
                label="INGRESO BANCO"
                tooltip={invTooltip("ingreso_banco")}
              />
              <TableColumnHeader
                className="w-[110px] text-right"
                label="EFECTIVO"
                tooltip={invTooltip("efectivo")}
              />
              <TableColumnHeader
                className="w-[100px] text-right"
                label="JASP"
                tooltip={invTooltip("jasp")}
              />
              <TableColumnHeader
                className="w-[110px]"
                label="TRANSFE"
                tooltip={invTooltip("transfe")}
              />
              <TableColumnHeader
                className="w-[120px]"
                label="FECHA COMPRA"
                tooltip={invTooltip("fecha_compra")}
              />
              <TableColumnHeader
                className="w-[120px]"
                label="FECHA VENTA"
                tooltip={invTooltip("fecha_venta")}
              />
              <TableColumnHeader
                className="w-[80px]"
                label="OCUPADO"
                tooltip={invTooltip("ocupado")}
              />
              <TableColumnHeader
                className="w-[90px]"
                label="LIQUIDADA"
                tooltip={invTooltip("liquidada")}
              />
              <TableColumnHeader
                className="min-w-[150px]"
                label="NOTAS"
                tooltip={invTooltip("notas")}
              />
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>

            {/* ── Totals row ── */}
            <TableRow className="bg-background font-semibold border-b-2">
              <TableCell className="min-w-[50px] max-w-[50px] sticky left-0 z-30 bg-background" />
              <TableCell />
              <TableCell className="sticky left-[50px] z-30 bg-background shadow-[4px_0_4px_-4px_rgba(0,0,0,0.15)]" />
              <TableCell colSpan={2} />
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.aportacion)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.retribucion)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.retencion)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm bg-yellow-50">
                {formatEuro(totals.ingreso_banco)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.efectivo)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.jasp_10_percent)}
              </TableCell>
              <TableCell colSpan={6} />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={18}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay propiedades para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row, idx) => {
                const isLiquidada = propertyIsLiquidada(row);
                const displayEjercicio = propertyEjercicio(row);
                // Use liquidación values only when the property is actually marked as liquidated.
                const displayAportacion = isLiquidada && row.liq ? row.liq.aportacion : row.aportacion;
                const displayRetribucion = isLiquidada && row.liq ? row.liq.retribucion : row.retribucion;
                const displayRetencion =
                  isLiquidada && row.liq
                    ? row.liq.retencion
                    : calcRetencion(toNum(row.retribucion));
                const displayIngresoBanco = effectiveIngresoBancoPropiedad({
                  ingreso_banco: row.ingreso_banco,
                  liqTransferencia: row.liq?.transferencia ?? null,
                });
                const displayEfectivo = isLiquidada && row.liq ? row.liq.efectivo : row.efectivo;

                // Per-year sequential ID when a year is selected; global numero_operacion otherwise
                const isBorrador = row.estado === "borrador";

                return (
                <TableRow key={row.id} className={isLiquidada ? "bg-green-50/40" : isBorrador ? "opacity-60" : ""}>
                  {/* ID */}
                  <TableCell className={`text-sm font-medium tabular-nums min-w-[50px] max-w-[50px] sticky left-0 z-10 ${isLiquidada ? "bg-green-50" : "bg-background"}`}>
                    {isBorrador ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <EditableCell
                        value={row.numero_operacion}
                        type="text"
                        onSave={(v) => {
                          const parsed = v == null || String(v).trim() === "" ? null : parseInt(String(v), 10);
                          if (v != null && String(v).trim() !== "" && (!Number.isFinite(parsed!) || parsed! < 1)) {
                            toast.error("El ID debe ser un número entero positivo");
                            return;
                          }
                          saveField(row.id, "numero_operacion", parsed);
                        }}
                      />
                    )}
                  </TableCell>

                  {/* AÑO (ejercicio desde liquidación) */}
                  <TableCell className="text-sm tabular-nums text-muted-foreground">
                    {displayEjercicio ?? "—"}
                  </TableCell>

                  {/* NOMBRE */}
                  <TableCell className={`sticky left-[50px] z-10 shadow-[4px_0_4px_-4px_rgba(0,0,0,0.15)] ${isLiquidada ? "bg-green-50" : "bg-background"}`}>
                    <EditableCell
                      value={row.titulo}
                      type="text"
                      onSave={(v) =>
                        saveField(row.id, "titulo", v)
                      }
                    />
                  </TableCell>

                  {/* ESTADO */}
                  <TableCell>
                    <EditableCell
                      value={row.estado}
                      type="badge-select"
                      options={[...ESTADO_OPTIONS]}
                      onSave={(v) =>
                        saveField(row.id, "estado", v)
                      }
                    />
                  </TableCell>

                  {/* FECHA INICIO */}
                  <TableCell>
                    <EditableCell
                      value={
                        row.created_at
                          ? row.created_at.substring(0, 10)
                          : null
                      }
                      type="date"
                      onSave={(v) =>
                        saveField(row.id, "created_at", v)
                      }
                    />
                  </TableCell>

                  {/* APORTACIÓN */}
                  <TableCell>
                    {isLiquidada ? (
                      <EditableCell value={displayAportacion} type="readonly-money" onSave={() => {}} />
                    ) : (
                      <EditableCell
                        value={row.aportacion}
                        type="money"
                        onSave={(v) => saveField(row.id, "aportacion", v)}
                      />
                    )}
                  </TableCell>

                  {/* RETRIBUCIÓN (desde liquidaciones / bruto) */}
                  <TableCell>
                    <EditableCell
                      value={displayRetribucion}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* RETENCIÓN (always readonly) */}
                  <TableCell>
                    <EditableCell
                      value={displayRetencion}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* INGRESO BANCO / TRANSFERENCIA (highlighted) */}
                  <TableCell className="bg-yellow-50">
                    {isLiquidada ? (
                      <EditableCell value={displayIngresoBanco} type="readonly-money" onSave={() => {}} />
                    ) : (
                      <EditableCell
                        value={row.ingreso_banco}
                        type="money"
                        highlight
                        onSave={(v) => saveField(row.id, "ingreso_banco", v)}
                      />
                    )}
                  </TableCell>

                  {/* EFECTIVO (always readonly) */}
                  <TableCell>
                    <EditableCell
                      value={displayEfectivo}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* JASP: % participación del bruto, o manual si no liquidada */}
                  <TableCell>
                    {isLiquidada ? (
                      <EditableCell
                        value={row.jasp_10_percent}
                        type="readonly-money"
                        onSave={() => {}}
                      />
                    ) : (
                      <div
                        className="min-w-[72px]"
                        title={
                          row.jasp_manual
                            ? "Valor manual — doble clic para volver al cálculo automático"
                            : "Cálculo automático (% JASP del bruto) — clic para editar"
                        }
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          if (row.jasp_manual) {
                            saveField(row.id, "__jasp_auto__", null);
                          }
                        }}
                      >
                        <EditableCell
                          value={row.jasp_10_percent}
                          type="money"
                          className={
                            row.jasp_manual
                              ? "text-amber-800 dark:text-amber-200 font-medium"
                              : ""
                          }
                          onSave={(v) => saveField(row.id, "jasp_10_percent", v)}
                        />
                      </div>
                    )}
                  </TableCell>

                  {/* TRANSFE (date — from liquidación if available) */}
                  <TableCell>
                    {isLiquidada && row.liq?.fecha_transferencia ? (
                      <span className="text-sm tabular-nums">
                        {new Date(row.liq.fecha_transferencia).toLocaleDateString("es-ES")}
                      </span>
                    ) : (
                      <EditableCell
                        value={
                          row.transfe
                            ? row.transfe.substring(0, 10)
                            : null
                        }
                        type="date"
                        onSave={(v) => saveField(row.id, "transfe", v)}
                      />
                    )}
                  </TableCell>

                  {/* FECHA COMPRA */}
                  <TableCell>
                    <EditableCell
                      value={
                        row.fecha_compra
                          ? row.fecha_compra.substring(0, 10)
                          : null
                      }
                      type="date"
                      onSave={(v) =>
                        saveField(
                          row.id,
                          "fecha_compra",
                          v
                        )
                      }
                    />
                  </TableCell>

                  {/* FECHA VENTA */}
                  <TableCell>
                    <EditableCell
                      value={
                        row.fecha_venta
                          ? row.fecha_venta.substring(0, 10)
                          : null
                      }
                      type="date"
                      onSave={(v) =>
                        saveField(
                          row.id,
                          "fecha_venta",
                          v
                        )
                      }
                    />
                  </TableCell>

                  {/* OCUPADO */}
                  <TableCell>
                    <EditableCell
                      value={row.ocupado ? "true" : "false"}
                      type="select"
                      options={[...OCUPADO_OPTIONS]}
                      onSave={(v) =>
                        saveField(
                          row.id,
                          "ocupado",
                          v === "true"
                        )
                      }
                    />
                  </TableCell>

                  {/* LIQUIDADA (solo lectura; se edita en Liquidaciones) */}
                  <TableCell className="text-center">
                    {isLiquidada ? (
                      <Badge variant="success" className="text-xs">Sí</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">No</Badge>
                    )}
                  </TableCell>

                  {/* NOTAS */}
                  <TableCell>
                    <EditableCell
                      value={row.notas}
                      type="text"
                      onSave={(v) =>
                        saveField(row.id, "notas", v)
                      }
                    />
                  </TableCell>

                  {/* ELIMINAR */}
                  <TableCell>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setEditId(row.id);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: row.id,
                            name: row.titulo || "Sin nombre",
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredRows.length} propiedades
      </div>

      <PropertyDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditId(null);
        }}
        onSaved={reloadData}
        editId={editId}
      />

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Eliminar propiedad"
        description={`¿Seguro que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmWord="ELIMINAR"
        onConfirm={deleteProperty}
      />
    </div>
  );
}
