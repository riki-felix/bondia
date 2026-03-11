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
  aportacion: number;
  retribucion: number;
  retencion: number;
  neto: number;
  efectivo: number;
  transferencia: number;
  fecha_transferencia: string | null;
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

// ─── Component ───────────────────────────────────────────────

export default function LiquidacionesTable({
  initialData,
  properties,
}: LiquidacionesTableProps) {
  const [rows, setRows] = useState<SettlementRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Property options for select cells
  const propertyOptions = useMemo(
    () => properties.map((p) => ({ value: p.id, label: p.titulo })),
    [properties]
  );

  // Ejercicio year options: 2020 → current year
  const ejercicioOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const opts = [];
    for (let y = 2020; y <= currentYear; y++) {
      opts.push({ value: String(y), label: String(y) });
    }
    return opts;
  }, []);

  // ── Filtering ──
  const filteredRows = useMemo(() => {
    let result = rows;

    if (propertyFilter !== "all") {
      result = result.filter((r) => r.propiedad_id === propertyFilter);
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
  }, [rows, propertyFilter, search]);

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
        "id, propiedad_id, fecha_liquidacion, numero_liquidacion, aportacion, retribucion, retencion, neto, efectivo, transferencia, fecha_transferencia, liquidado, ejercicio, created_at, updated_at, propiedades(titulo)"
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
      />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar por propiedad o número…"
          className="max-w-xs h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={propertyFilter} onValueChange={setPropertyFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder="Propiedad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las propiedades</SelectItem>
            {propertyOptions.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
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
              <TableHead className="w-[50px]">Nº</TableHead>
              <TableHead className="min-w-[200px]">PROPIEDAD</TableHead>
              <TableHead className="w-[130px]">FECHA</TableHead>
              <TableHead className="w-[120px] text-right">APORTACIÓN</TableHead>
              <TableHead className="w-[120px] text-right">RETRIBUCIÓN</TableHead>
              <TableHead className="w-[120px] text-right">RETENCIÓN</TableHead>
              <TableHead className="w-[120px] text-right">NETO</TableHead>
              <TableHead className="w-[120px] text-right">EFECTIVO</TableHead>
              <TableHead className="w-[130px] text-right">TRANSFERENCIA</TableHead>
              <TableHead className="w-[130px]">FECHA TRANSFE</TableHead>
              <TableHead className="w-[80px] text-center">LIQUIDADO</TableHead>
              <TableHead className="w-[90px]">EJERCICIO</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>

            {/* ── Totals row ── */}
            <TableRow className="bg-muted/20 font-semibold border-b-2">
              <TableCell colSpan={3} />
              <TableCell className="text-right tabular-nums text-sm">
                {formatEuro(totals.aportacion)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatEuro(totals.retribucion)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatEuro(totals.retencion)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatEuro(totals.neto)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatEuro(totals.efectivo)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-sm">
                {formatEuro(totals.transferencia)}
              </TableCell>
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
                  colSpan={13}
                  className="text-center text-muted-foreground py-8"
                >
                  No hay liquidaciones para mostrar.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  {/* Nº */}
                  <TableCell className="text-sm font-medium tabular-nums">
                    {row.numero_liquidacion}
                  </TableCell>

                  {/* PROPIEDAD */}
                  <TableCell>
                    <EditableCell
                      value={row.propiedad_id}
                      type="select"
                      options={propertyOptions}
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
