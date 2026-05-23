// src/components/liquidaciones/LiquidacionesTable.tsx
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
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { getSupabase } from "@/lib/supabaseReact";
import { formatEuro, round2, toNum } from "@/lib/moneyCalc";
import {
  deriveSettlementMoney,
  syncPropiedadFromLiquidaciones,
} from "@/lib/syncPropiedadFromLiquidaciones";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { LiquidacionesSummary } from "./LiquidacionesSummary";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { sumTransferenciasLiquidaciones } from "@/lib/ingresosBancoAggregate";

// ─── Types ───────────────────────────────────────────────────

interface SettlementRow {
  id: string;
  propiedad_id: string;
  fecha_liquidacion: string;
  numero_liquidacion: number;
  numero_operacion: number | null;
  beneficio_bruto: number | null;
  aportacion: number;
  retribucion: number;
  retencion: number;
  neto: number;
  efectivo: number;
  transferencia: number;
  fecha_transferencia: string | null;
  fecha_aportacion: string | null;
  liquidado: boolean;
  ejercicio: number | null;
  propiedad_titulo?: string;
  propiedad_participacion_sanyus?: number | null;
}

function mapSettlementRow(r: Record<string, unknown>): SettlementRow {
  const prop = r.propiedades as Record<string, unknown> | null;
  return {
    ...(r as unknown as SettlementRow),
    propiedad_titulo: (prop?.titulo as string) ?? "",
    propiedad_participacion_sanyus:
      (prop?.participacion_sanyus as number | null) ?? null,
  };
}

interface PropertyOption {
  id: string;
  titulo: string;
  participacion_sanyus?: number | null;
}

const PROPERTY_PLACEHOLDER = {
  value: "__none__",
  label: "Elige propiedad",
} as const;

function isDraftRow(row: Pick<SettlementRow, "id">): boolean {
  return row.id.startsWith("draft-");
}

function createEmptyDraftRow(): SettlementRow {
  const today = new Date().toISOString().split("T")[0];
  return {
    id: `draft-${crypto.randomUUID()}`,
    propiedad_id: "",
    fecha_liquidacion: today,
    numero_liquidacion: 0,
    numero_operacion: null,
    beneficio_bruto: null,
    aportacion: 0,
    retribucion: 0,
    retencion: 0,
    neto: 0,
    efectivo: 0,
    transferencia: 0,
    fecha_transferencia: null,
    fecha_aportacion: null,
    liquidado: false,
    ejercicio: new Date().getFullYear(),
    propiedad_titulo: "",
    propiedad_participacion_sanyus: null,
  };
}

function settlementFromApi(
  data: Record<string, unknown>,
  properties: PropertyOption[]
): SettlementRow {
  const prop = properties.find((p) => p.id === data.propiedad_id);
  return {
    ...(data as unknown as SettlementRow),
    propiedad_titulo: prop?.titulo ?? "",
    propiedad_participacion_sanyus: prop?.participacion_sanyus ?? null,
  };
}

interface LiquidacionesTableProps {
  initialData: SettlementRow[];
  properties: PropertyOption[];
  years: number[];
}

// ─── Helpers ─────────────────────────────────────────────────

function calcDuracion(fechaAportacion: string | null, fechaTransferencia: string | null): { days: number; months: number } | null {
  if (!fechaAportacion || !fechaTransferencia) return null;
  const a = new Date(fechaAportacion);
  const b = new Date(fechaTransferencia);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const diffMs = b.getTime() - a.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.round(days / 30);
  return { days, months };
}

function calcBeneficio(retribucion: number, aportacion: number, duracion: { days: number; months: number } | null): number | null {
  if (!duracion || aportacion === 0) return null;
  const meses = Math.max(duracion.months, 1);
  const ratio = retribucion / aportacion;
  return (ratio / meses) * 100;
}

// ─── Component ───────────────────────────────────────────────

export default function LiquidacionesTable({
  initialData,
  properties,
  years,
}: LiquidacionesTableProps) {
  const [rows, setRows] = useState<SettlementRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [ejercicioFilter, setEjercicioFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

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
  const filteredRows = useMemo(() => {
    let result = rows;

    if (ejercicioFilter !== "all") {
      result = result.filter((r) => String(r.ejercicio) === ejercicioFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.propiedad_titulo?.toLowerCase().includes(q) ||
          String(r.numero_liquidacion).includes(q)
      );
    }

    return result;
  }, [rows, ejercicioFilter, search]);

  // ── Totals ──
  const totals = useMemo(() => {
    const result: Record<string, number> = {
      beneficio_bruto: 0,
      aportacion: 0,
      retribucion: 0,
      retencion: 0,
      neto: 0,
      efectivo: 0,
    };
    for (const row of filteredRows) {
      if (isDraftRow(row)) continue;
      result.beneficio_bruto += toNum(row.beneficio_bruto);
      result.aportacion += toNum(row.aportacion);
      const derived = deriveSettlementMoney(row);
      result.retribucion += derived.retribucion;
      result.retencion += derived.retencion;
      result.neto += derived.neto;
      result.efectivo += derived.efectivo;
    }
    for (const key of Object.keys(result)) {
      result[key] = round2(result[key]);
    }
    const { total: transferencia } = sumTransferenciasLiquidaciones(
      filteredRows.map((r) => ({
        transferencia: r.transferencia,
        ejercicio: r.ejercicio,
      })),
      ejercicioFilter
    );
    result.transferencia = transferencia;
    return result;
  }, [filteredRows, ejercicioFilter]);

  const applyRowPatch = useCallback(
    (row: SettlementRow, field: string, value: unknown): SettlementRow => {
      const updated = { ...row, [field]: value };

      if (field === "beneficio_bruto") {
        updated.beneficio_bruto =
          value == null || value === "" ? null : toNum(value);
      }

      if (field === "propiedad_id") {
        const propId = value != null && value !== "" ? String(value) : "";
        updated.propiedad_id = propId;
        const prop = properties.find((p) => p.id === propId);
        if (prop) {
          updated.propiedad_titulo = prop.titulo;
          updated.propiedad_participacion_sanyus =
            prop.participacion_sanyus ?? null;
        } else {
          updated.propiedad_titulo = "";
          updated.propiedad_participacion_sanyus = null;
        }
      }

      const derived = deriveSettlementMoney(updated);
      Object.assign(updated, {
        retribucion: derived.retribucion,
        retencion: derived.retencion,
        neto: derived.neto,
        efectivo: derived.efectivo,
      });

      return updated;
    },
    [properties]
  );

  const persistDraft = useCallback(
    async (draft: SettlementRow) => {
      if (!draft.propiedad_id) {
        toast.error("Elige una propiedad para guardar la liquidación");
        return;
      }

      try {
        const res = await fetch("/.netlify/functions/createSettlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propiedad_id: draft.propiedad_id,
            fecha_liquidacion: draft.fecha_liquidacion,
            numero_operacion: draft.numero_operacion,
            beneficio_bruto: draft.beneficio_bruto,
            aportacion: draft.aportacion,
            retribucion: draft.retribucion,
            transferencia: draft.transferencia,
            fecha_transferencia: draft.fecha_transferencia,
            fecha_aportacion: draft.fecha_aportacion,
            liquidado: draft.liquidado,
            ejercicio: draft.ejercicio,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al crear");

        const saved = settlementFromApi(
          data as Record<string, unknown>,
          properties
        );
        setRows((prev) =>
          prev.map((r) => (r.id === draft.id ? saved : r))
        );
        if (toNum(saved.beneficio_bruto) > 0) {
          await syncPropiedadFromLiquidaciones(getSupabase(), saved.propiedad_id);
        }
        toast.success("Liquidación creada");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al crear liquidación";
        toast.error(message);
      }
    },
    [properties]
  );

  // ── Save field ──
  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      let draftToPersist: SettlementRow | null = null;

      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = applyRowPatch(r, field, value);
          if (
            isDraftRow(updated) &&
            field === "propiedad_id" &&
            updated.propiedad_id
          ) {
            draftToPersist = updated;
          }
          return updated;
        })
      );

      if (draftToPersist) {
        await persistDraft(draftToPersist);
        return;
      }

      const row = rows.find((r) => r.id === id);
      if (!row || isDraftRow(row)) return;

      const nextRow = { ...row, [field]: value };
      if (field === "beneficio_bruto") {
        nextRow.beneficio_bruto =
          value == null || value === "" ? null : toNum(value);
      }
      if (field === "propiedad_id") {
        const prop = properties.find((p) => p.id === value);
        if (prop) {
          nextRow.propiedad_participacion_sanyus =
            prop.participacion_sanyus ?? null;
        }
      }

      const derived = deriveSettlementMoney(nextRow);
      const payload: Record<string, unknown> = { [field]: value };

      if (field === "beneficio_bruto") {
        payload.beneficio_bruto = nextRow.beneficio_bruto;
        payload.retribucion = derived.retribucion;
      } else if (field === "propiedad_id" && toNum(nextRow.beneficio_bruto) > 0) {
        payload.retribucion = derived.retribucion;
      }

      const syncPropiedad =
        field === "beneficio_bruto" ||
        (field === "propiedad_id" && toNum(nextRow.beneficio_bruto) > 0);

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("liquidaciones")
          .update(payload)
          .eq("id", id);
        if (error) throw error;

        if (syncPropiedad) {
          await syncPropiedadFromLiquidaciones(supabase, nextRow.propiedad_id);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al guardar";
        toast.error(message);
      }
    },
    [applyRowPatch, persistDraft, properties, rows]
  );

  // ── Swap numero_liquidacion ──
  const swapOrder = useCallback(
    async (id: string, newNum: number) => {
      const current = rows.find((r) => r.id === id);
      if (!current || current.numero_liquidacion === newNum) return;

      const oldNum = current.numero_liquidacion;

      // Optimistic update
      setRows((prev) =>
        prev.map((r) => {
          if (r.id === id) return { ...r, numero_liquidacion: newNum };
          if (r.numero_liquidacion === newNum) return { ...r, numero_liquidacion: oldNum };
          return r;
        })
      );

      try {
        const res = await fetch("/.netlify/functions/swapSettlementOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, numero_liquidacion: newNum }),
        });
        if (!res.ok) {
          const text = await res.text();
          let msg = "Error al reordenar";
          try { msg = JSON.parse(text).error || msg; } catch {}
          throw new Error(msg);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al reordenar";
        toast.error(message);
        // Revert
        setRows((prev) =>
          prev.map((r) => {
            if (r.id === id) return { ...r, numero_liquidacion: oldNum };
            if (r.numero_liquidacion === oldNum && r.id !== id) return { ...r, numero_liquidacion: newNum };
            return r;
          })
        );
      }
    },
    [rows]
  );

  // ── Create new settlement (fila borrador al inicio) ──
  const createSettlement = useCallback(() => {
    if (properties.length === 0) {
      toast.error("No hay propiedades disponibles");
      return;
    }
    setRows((prev) => [createEmptyDraftRow(), ...prev]);
  }, [properties.length]);

  // ── Delete settlement ──
  const deleteSettlement = useCallback(async () => {
    if (!deleteTarget) return;

    if (isDraftRow({ id: deleteTarget.id })) {
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      return;
    }

    const res = await fetch("/.netlify/functions/deleteSettlement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: deleteTarget.id }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Error al eliminar");
    }

    setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success("Liquidación eliminada");
  }, [deleteTarget]);

  // ── Reload data ──
  const reloadData = useCallback(async () => {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("liquidaciones")
      .select(
        "id, propiedad_id, fecha_liquidacion, numero_liquidacion, numero_operacion, beneficio_bruto, aportacion, retribucion, retencion, neto, efectivo, transferencia, fecha_transferencia, fecha_aportacion, liquidado, ejercicio, created_at, updated_at, propiedades(titulo, participacion_sanyus)"
      )
      .order("numero_liquidacion", { ascending: true });

    if (data) {
      setRows(data.map((r) => mapSettlementRow(r as Record<string, unknown>)));
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* ── Summary widgets ── */}
      <LiquidacionesSummary
        totalTransferencia={totals.transferencia}
        totalEfectivo={totals.efectivo}
        totalAportacion={totals.aportacion}
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por propiedad o número…"
          className="max-w-xs h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={ejercicioFilter} onValueChange={setEjercicioFilter}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue placeholder="Ejercicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {ejercicioOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <Button size="sm" onClick={createSettlement}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva liquidación
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[60px]">Nº</TableHead>
              <TableHead className="w-[50px]">OP</TableHead>
              <TableHead className="min-w-[200px]">PROPIEDAD</TableHead>
              <TableHead className="w-[130px]">FECHA</TableHead>
              <TableHead className="w-[120px] text-right">APORTACIÓN</TableHead>
              <TableHead className="w-[110px] text-right" title="Beneficio bruto">
                BRUTO
              </TableHead>
              <TableHead className="w-[120px] text-right">RETRIBUCIÓN</TableHead>
              <TableHead className="w-[120px] text-right">RETENCIÓN</TableHead>
              <TableHead className="w-[120px] text-right">NETO</TableHead>
              <TableHead className="w-[120px] text-right">EFECTIVO</TableHead>
              <TableHead className="w-[130px] text-right">TRANSFERENCIA</TableHead>
              <TableHead className="w-[130px]">FECHA TRANSFE</TableHead>
              <TableHead className="w-[130px]">FECHA APORTACIÓN</TableHead>
              <TableHead className="w-[130px] text-right">DURACIÓN</TableHead>
              <TableHead className="w-[100px] text-right">BENEFICIO</TableHead>
              <TableHead className="w-[80px] text-center">LIQUIDADO</TableHead>
              <TableHead className="w-[90px]">EJERCICIO</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>

            {/* ── Totals row ── */}
            <TableRow className="bg-muted/20 font-semibold border-b-2">
              <TableCell colSpan={4} />
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.aportacion)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.beneficio_bruto)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.retribucion)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.retencion)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.neto)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.efectivo)}
              </TableCell>
              <TableCell data-money className="text-right tabular-nums text-sm">
                {formatEuro(totals.transferencia)}
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={18}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay liquidaciones para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => {
                const money = deriveSettlementMoney(row);
                const draft = isDraftRow(row);
                return (
                <TableRow
                  key={row.id}
                  className={
                    draft
                      ? "bg-amber-50/90 border-l-4 border-l-amber-400 hover:bg-amber-50"
                      : undefined
                  }
                >
                  {/* Nº */}
                  <TableCell className={draft ? "bg-amber-50/90" : undefined}>
                    {draft ? (
                      <span className="text-sm text-muted-foreground px-1">—</span>
                    ) : (
                    <EditableCell
                      value={String(row.numero_liquidacion)}
                      type="text"
                      className="w-[50px] [&_input]:px-1 [&_input]:text-center"
                      onSave={(v) => {
                        const n = Number(v);
                        if (Number.isFinite(n) && n >= 1) swapOrder(row.id, n);
                      }}
                    />
                    )}
                  </TableCell>

                  {/* OP */}
                  <TableCell>
                    <EditableCell
                      value={row.numero_operacion != null ? String(row.numero_operacion) : null}
                      type="text"
                      className="w-[50px] [&_input]:px-1 [&_input]:text-center"
                      onSave={(v) => saveField(row.id, "numero_operacion", v ? Number(v) : null)}
                    />
                  </TableCell>

                  {/* PROPIEDAD */}
                  <TableCell className={draft ? "bg-amber-50/90" : undefined}>
                    <EditableCell
                      value={row.propiedad_id || null}
                      type="select"
                      selectPlaceholder={PROPERTY_PLACEHOLDER}
                      options={properties.map((p) => ({ value: p.id, label: p.titulo }))}
                      onSave={(v) => saveField(row.id, "propiedad_id", v)}
                    />
                  </TableCell>

                  {/* FECHA */}
                  <TableCell>
                    <EditableCell
                      value={
                        row.fecha_liquidacion
                          ? row.fecha_liquidacion.substring(0, 10)
                          : null
                      }
                      type="date"
                      onSave={(v) =>
                        saveField(row.id, "fecha_liquidacion", v)
                      }
                    />
                  </TableCell>

                  {/* APORTACIÓN */}
                  <TableCell>
                    <EditableCell
                      value={row.aportacion}
                      type="money"
                      onSave={(v) => saveField(row.id, "aportacion", v)}
                    />
                  </TableCell>

                  {/* BRUTO */}
                  <TableCell>
                    <EditableCell
                      value={row.beneficio_bruto}
                      type="money"
                      onSave={(v) => saveField(row.id, "beneficio_bruto", v)}
                    />
                  </TableCell>

                  {/* RETRIBUCIÓN (% Sanyus del bruto) */}
                  <TableCell>
                    <EditableCell
                      value={money.retribucion}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* RETENCIÓN (calculated) */}
                  <TableCell>
                    <EditableCell
                      value={money.retencion}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* NETO (calculated) */}
                  <TableCell>
                    <EditableCell
                      value={money.neto}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* EFECTIVO (calculated) */}
                  <TableCell>
                    <EditableCell
                      value={money.efectivo}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* TRANSFERENCIA */}
                  <TableCell>
                    <EditableCell
                      value={row.transferencia}
                      type="money"
                      onSave={(v) => saveField(row.id, "transferencia", v)}
                    />
                  </TableCell>

                  {/* FECHA TRANSFERENCIA */}
                  <TableCell>
                    <EditableCell
                      value={
                        row.fecha_transferencia
                          ? row.fecha_transferencia.substring(0, 10)
                          : null
                      }
                      type="date"
                      onSave={(v) =>
                        saveField(row.id, "fecha_transferencia", v)
                      }
                    />
                  </TableCell>

                  {/* FECHA APORTACIÓN */}
                  <TableCell>
                    <EditableCell
                      value={
                        row.fecha_aportacion
                          ? row.fecha_aportacion.substring(0, 10)
                          : null
                      }
                      type="date"
                      onSave={(v) =>
                        saveField(row.id, "fecha_aportacion", v)
                      }
                    />
                  </TableCell>

                  {/* DURACIÓN (calculated) */}
                  {(() => {
                    const duracion = calcDuracion(row.fecha_aportacion, row.fecha_transferencia);
                    const beneficio = calcBeneficio(
                      money.retribucion,
                      row.aportacion,
                      duracion
                    );
                    return (
                      <>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {duracion
                            ? `${duracion.days}d (${duracion.months}m)`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {beneficio != null
                            ? `${Math.round(beneficio)}%`
                            : "—"}
                        </TableCell>
                      </>
                    );
                  })()}

                  {/* LIQUIDADO */}
                  <TableCell className="text-center">
                    <Checkbox
                      checked={row.liquidado}
                      onCheckedChange={(checked) =>
                        saveField(row.id, "liquidado", checked === true)
                      }
                    />
                  </TableCell>

                  {/* EJERCICIO */}
                  <TableCell>
                    <EditableCell
                      value={row.ejercicio != null ? String(row.ejercicio) : null}
                      type="select"
                      options={ejercicioOptions}
                      onSave={(v) => saveField(row.id, "ejercicio", v ? Number(v) : null)}
                    />
                  </TableCell>

                  {/* DELETE */}
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setDeleteTarget({
                          id: row.id,
                          name: draft
                            ? "Nueva liquidación (sin guardar)"
                            : `Liquidación #${row.numero_liquidacion} - ${row.propiedad_titulo || ""}`,
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

      <div className="text-sm text-muted-foreground">
        {filteredRows.length} liquidaciones
      </div>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title="Eliminar liquidación"
        description={`¿Seguro que quieres eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmWord="ELIMINAR"
        onConfirm={deleteSettlement}
      />
    </div>
  );
}
