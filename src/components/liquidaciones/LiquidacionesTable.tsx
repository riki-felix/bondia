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
import {
  calcRetencion,
  calcNeto,
  calcEfectivoFromTransfer,
  formatEuro,
  sumColumn,
  toNum,
} from "@/lib/moneyCalc";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { LiquidacionesSummary } from "./LiquidacionesSummary";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

// ─── Types ───────────────────────────────────────────────────

interface SettlementRow {
  id: string;
  propiedad_id: string;
  fecha_liquidacion: string;
  numero_liquidacion: number;
  numero_operacion: number | null;
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
}

interface PropertyOption {
  id: string;
  titulo: string;
}

interface LiquidacionesTableProps {
  initialData: SettlementRow[];
  properties: PropertyOption[];
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
}: LiquidacionesTableProps) {
  const [rows, setRows] = useState<SettlementRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [ejercicioFilter, setEjercicioFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Ejercicio year options from actual data
  const ejercicioOptions = useMemo(() => {
    const years = new Set<number>();
    for (const r of rows) {
      if (r.ejercicio != null) years.add(r.ejercicio);
    }
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: String(y) }));
  }, [rows]);

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
    const fields = [
      "aportacion",
      "retribucion",
      "retencion",
      "neto",
      "efectivo",
      "transferencia",
    ] as const;
    const result: Record<string, number> = {};
    for (const f of fields) {
      result[f] = sumColumn(filteredRows as unknown as Record<string, unknown>[], f);
    }
    return result;
  }, [filteredRows]);

  // ── Save field ──
  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, [field]: value };

          // Recalculate generated fields
          if (field === "retribucion" || field === "transferencia") {
            const retribucion = toNum(
              field === "retribucion" ? value : r.retribucion
            );
            const transferencia = toNum(
              field === "transferencia" ? value : r.transferencia
            );
            const retencion = calcRetencion(retribucion);
            const neto = calcNeto(retribucion, retencion);
            const efectivo = calcEfectivoFromTransfer(neto, transferencia);
            Object.assign(updated, { retencion, neto, efectivo });
          }

          // Update property title if property changes
          if (field === "propiedad_id") {
            const prop = properties.find((p) => p.id === value);
            if (prop) updated.propiedad_titulo = prop.titulo;
          }

          return updated;
        })
      );

      // Persist to DB (only user-editable fields)
      const payload: Record<string, unknown> = { [field]: value };

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("liquidaciones")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al guardar";
        toast.error(message);
      }
    },
    [properties]
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

  // ── Create new settlement ──
  const createSettlement = useCallback(async () => {
    try {
      const defaultProperty = properties[0];
      if (!defaultProperty) {
        toast.error("No hay propiedades disponibles");
        return;
      }

      const res = await fetch("/.netlify/functions/createSettlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propiedad_id: defaultProperty.id,
          fecha_liquidacion: new Date().toISOString().split("T")[0],
          aportacion: 0,
          retribucion: 0,
          transferencia: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear");

      // Reload from Supabase
      await reloadData();
      toast.success("Liquidación creada");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al crear liquidación";
      toast.error(message);
    }
  }, [properties]);

  // ── Delete settlement ──
  const deleteSettlement = useCallback(async () => {
    if (!deleteTarget) return;

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
        "id, propiedad_id, fecha_liquidacion, numero_liquidacion, numero_operacion, aportacion, retribucion, retencion, neto, efectivo, transferencia, fecha_transferencia, fecha_aportacion, liquidado, ejercicio, created_at, updated_at, propiedades(titulo)"
      )
      .order("numero_liquidacion", { ascending: true });

    if (data) {
      const mapped = data.map((r: Record<string, unknown>) => ({
        ...r,
        propiedad_titulo: (r.propiedades as Record<string, string> | null)?.titulo ?? "",
      })) as SettlementRow[];
      setRows(mapped);
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
                  colSpan={17}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay liquidaciones para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  {/* Nº */}
                  <TableCell>
                    <EditableCell
                      value={String(row.numero_liquidacion)}
                      type="text"
                      className="w-[50px] [&_input]:px-1 [&_input]:text-center"
                      onSave={(v) => {
                        const n = Number(v);
                        if (Number.isFinite(n) && n >= 1) swapOrder(row.id, n);
                      }}
                    />
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
                  <TableCell>
                    <EditableCell
                      value={row.propiedad_id}
                      type="select"
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

                  {/* RETRIBUCIÓN */}
                  <TableCell>
                    <EditableCell
                      value={row.retribucion}
                      type="money"
                      onSave={(v) => saveField(row.id, "retribucion", v)}
                    />
                  </TableCell>

                  {/* RETENCIÓN (calculated) */}
                  <TableCell>
                    <EditableCell
                      value={row.retencion}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* NETO (calculated) */}
                  <TableCell>
                    <EditableCell
                      value={row.neto}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* EFECTIVO (calculated) */}
                  <TableCell>
                    <EditableCell
                      value={row.efectivo}
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
                    const beneficio = calcBeneficio(row.retribucion, row.aportacion, duracion);
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
                          name: `Liquidación #${row.numero_liquidacion} - ${row.propiedad_titulo || ""}`
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
