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
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "../inversiones/EditableCell";
import { toast } from "@/components/ui/sonner";
import { formatEuro, toNum } from "@/lib/moneyCalc";
import { sumLiquidacionesTotals } from "@/lib/liquidacionesTotals";
import {
  deriveBrutoFromRetribucion,
  deriveSettlementMoney,
} from "@/lib/syncPropiedadFromLiquidaciones";
import { LiquidacionesSummary } from "./LiquidacionesSummary";
import { TableColumnHeader } from "@/components/ui/table-column-header";
import {
  getEngineColumnTooltip,
  type LiquidacionesColumnKey,
} from "@/lib/engineTableColumnTooltips";

const liqTooltip = (column: LiquidacionesColumnKey) =>
  getEngineColumnTooltip("liquidaciones", column);

interface SettlementRow {
  id: string;
  propiedad_id: string;
  fecha_liquidacion: string | null;
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
  propiedad_numero_operacion?: number | null;
}

function mapSettlementRow(r: Record<string, unknown>): SettlementRow {
  const prop = r.propiedades as Record<string, unknown> | null;
  return {
    ...(r as unknown as SettlementRow),
    propiedad_titulo: (prop?.titulo as string) ?? "",
    propiedad_participacion_sanyus:
      (prop?.participacion_sanyus as number | null) ?? null,
    propiedad_numero_operacion: (prop?.numero_operacion as number | null) ?? null,
  };
}

interface LiquidacionesTableProps {
  initialData: SettlementRow[];
  years: number[];
  initialYear: number | null;
}

function calcDuracion(
  fechaAportacion: string | null,
  fechaTransferencia: string | null
): { days: number; months: number } | null {
  if (!fechaAportacion || !fechaTransferencia) return null;
  const a = new Date(fechaAportacion);
  const b = new Date(fechaTransferencia);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const diffMs = b.getTime() - a.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.round(days / 30);
  return { days, months };
}

function calcBeneficio(
  retribucion: number,
  aportacion: number,
  duracion: { days: number; months: number } | null
): number | null {
  if (!duracion || aportacion === 0) return null;
  const meses = Math.max(duracion.months, 1);
  const ratio = retribucion / aportacion;
  return (ratio / meses) * 100;
}

function LiquidadoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="inline-flex">
      {value ? (
        <Badge variant="success" className="text-xs cursor-pointer hover:opacity-90">
          Sí
        </Badge>
      ) : (
        <Badge variant="destructive" className="text-xs cursor-pointer hover:opacity-90">
          No
        </Badge>
      )}
    </button>
  );
}

export default function LiquidacionesTable({
  initialData,
  years,
  initialYear,
}: LiquidacionesTableProps) {
  const [rows, setRows] = useState<SettlementRow[]>(initialData);
  const [search, setSearch] = useState("");
  const [ejercicioFilter, setEjercicioFilter] = useState<string>(
    initialYear != null ? String(initialYear) : "all"
  );

  const ejercicioOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const minYear = years.length > 0 ? Math.min(...years) : currentYear;
    const opts: { value: string; label: string }[] = [];
    for (let y = currentYear; y >= minYear; y--) {
      opts.push({ value: String(y), label: String(y) });
    }
    return opts;
  }, [years]);

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
          String(r.propiedad_numero_operacion ?? "").includes(q) ||
          String(r.numero_operacion ?? "").includes(q)
      );
    }

    return [...result].sort((a, b) => {
      const na = a.propiedad_numero_operacion;
      const nb = b.propiedad_numero_operacion;
      if (na == null && nb == null) return 0;
      if (na == null) return 1;
      if (nb == null) return -1;
      return na - nb;
    });
  }, [rows, ejercicioFilter, search]);

  const totals = useMemo(
    () => sumLiquidacionesTotals(filteredRows),
    [filteredRows]
  );

  const applyRowPatch = useCallback(
    (row: SettlementRow, field: string, value: unknown): SettlementRow => {
      const updated = { ...row, [field]: value };

      if (field === "retribucion") {
        updated.retribucion = toNum(value);
      }

      if (field === "numero_operacion") {
        const n =
          value == null || value === ""
            ? null
            : Number(value);
        updated.numero_operacion =
          n != null && Number.isFinite(n) ? n : null;
      }

      const derived = deriveSettlementMoney(updated);
      updated.beneficio_bruto = deriveBrutoFromRetribucion(updated);
      Object.assign(updated, {
        retencion: derived.retencion,
        neto: derived.neto,
        efectivo: derived.efectivo,
      });

      return updated;
    },
    []
  );

  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      const row = rows.find((r) => r.id === id);
      if (!row) return;

      const optimistic = applyRowPatch(row, field, value);
      setRows((prev) => prev.map((r) => (r.id === id ? optimistic : r)));

      const payload: Record<string, unknown> = { id, [field]: value };

      if (field === "retribucion") {
        payload.retribucion = optimistic.retribucion;
        payload.beneficio_bruto = optimistic.beneficio_bruto;
      }

      try {
        const res = await fetch("/.netlify/functions/updateSettlement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al guardar");

        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  ...mapSettlementRow({
                    ...data,
                    propiedades: {
                      titulo: r.propiedad_titulo,
                      participacion_sanyus: r.propiedad_participacion_sanyus,
                      numero_operacion: r.propiedad_numero_operacion,
                    },
                  }),
                }
              : r
          )
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al guardar";
        toast.error(message);
        setRows((prev) => prev.map((r) => (r.id === id ? row : r)));
      }
    },
    [applyRowPatch, rows]
  );

  return (
    <div className="space-y-4">
      <LiquidacionesSummary
        totalTransferencia={totals.transferencia}
        totalEfectivo={totals.efectivo}
        totalAportacion={totals.aportacion}
      />

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
        <p className="text-sm text-muted-foreground ml-auto">
          Cada liquidación se crea al añadir una inversión.
        </p>
      </div>

      <div className="rounded-lg border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableColumnHeader
                className="w-[60px]"
                label="ID"
                tooltip={liqTooltip("id")}
              />
              <TableColumnHeader
                className="w-[60px]"
                label="Nº OP"
                tooltip={liqTooltip("numero_op")}
              />
              <TableColumnHeader
                className="min-w-[200px]"
                label="PROPIEDAD"
                tooltip={liqTooltip("propiedad")}
              />
              <TableColumnHeader
                className="w-[130px]"
                label="FECHA"
                tooltip={liqTooltip("fecha")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="APORTACIÓN"
                tooltip={liqTooltip("aportacion")}
              />
              <TableColumnHeader
                className="w-[110px] text-right"
                label="BRUTO"
                tooltip={liqTooltip("bruto")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="RETRIBUCIÓN"
                tooltip={liqTooltip("retribucion")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="RETENCIÓN"
                tooltip={liqTooltip("retencion")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="NETO"
                tooltip={liqTooltip("neto")}
              />
              <TableColumnHeader
                className="w-[120px] text-right"
                label="EFECTIVO"
                tooltip={liqTooltip("efectivo")}
              />
              <TableColumnHeader
                className="w-[130px] text-right"
                label="TRANSFERENCIA"
                tooltip={liqTooltip("transferencia")}
              />
              <TableColumnHeader
                className="w-[130px]"
                label="FECHA TRANSFE"
                tooltip={liqTooltip("fecha_transfe")}
              />
              <TableColumnHeader
                className="w-[130px]"
                label="FECHA APORTACIÓN"
                tooltip={liqTooltip("fecha_aportacion")}
              />
              <TableColumnHeader
                className="w-[130px] text-right"
                label="DURACIÓN"
                tooltip={liqTooltip("duracion")}
              />
              <TableColumnHeader
                className="w-[100px] text-right"
                label="BENEFICIO"
                tooltip={liqTooltip("beneficio")}
              />
              <TableColumnHeader
                className="w-[90px] text-center"
                label="LIQUIDADA"
                tooltip={liqTooltip("liquidada")}
              />
              <TableColumnHeader
                className="w-[90px]"
                label="EJERCICIO"
                tooltip={liqTooltip("ejercicio")}
              />
            </TableRow>

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
              <TableCell colSpan={6} />
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
              filteredRows.map((row) => {
                const money = deriveSettlementMoney(row);
                const bruto = deriveBrutoFromRetribucion(row);
                const duracion = calcDuracion(
                  row.fecha_aportacion,
                  row.fecha_transferencia
                );
                const beneficio = calcBeneficio(
                  money.retribucion,
                  row.aportacion,
                  duracion
                );
                const idInversion = row.propiedad_numero_operacion;

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-sm font-medium tabular-nums text-muted-foreground">
                      {idInversion ?? "—"}
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={
                          row.numero_operacion != null
                            ? String(row.numero_operacion)
                            : null
                        }
                        type="text"
                        className="w-[56px] [&_input]:px-1 [&_input]:text-center"
                        onSave={(v) =>
                          saveField(
                            row.id,
                            "numero_operacion",
                            v != null && String(v).trim() !== ""
                              ? Number(v)
                              : null
                          )
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <a
                        href={`/propiedades/${row.propiedad_id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {row.propiedad_titulo || "Sin título"}
                      </a>
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={
                          row.fecha_liquidacion
                            ? row.fecha_liquidacion.substring(0, 10)
                            : null
                        }
                        type="date"
                        onSave={(v) => saveField(row.id, "fecha_liquidacion", v)}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={row.aportacion}
                        type="money"
                        onSave={(v) => saveField(row.id, "aportacion", v)}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={bruto}
                        type="readonly-money"
                        onSave={() => {}}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={money.retribucion}
                        type="money"
                        onSave={(v) => saveField(row.id, "retribucion", v)}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={money.retencion}
                        type="readonly-money"
                        onSave={() => {}}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={money.neto}
                        type="readonly-money"
                        onSave={() => {}}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={money.efectivo}
                        type="readonly-money"
                        onSave={() => {}}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={row.transferencia}
                        type="money"
                        onSave={(v) => saveField(row.id, "transferencia", v)}
                      />
                    </TableCell>

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

                    <TableCell>
                      <EditableCell
                        value={
                          row.fecha_aportacion
                            ? row.fecha_aportacion.substring(0, 10)
                            : null
                        }
                        type="date"
                        onSave={(v) => saveField(row.id, "fecha_aportacion", v)}
                      />
                    </TableCell>

                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {duracion ? `${duracion.days}d (${duracion.months}m)` : "—"}
                    </TableCell>

                    <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                      {beneficio != null ? `${Math.round(beneficio)}%` : "—"}
                    </TableCell>

                    <TableCell className="text-center">
                      <LiquidadoToggle
                        value={row.liquidado}
                        onChange={(next) => saveField(row.id, "liquidado", next)}
                      />
                    </TableCell>

                    <TableCell>
                      <EditableCell
                        value={row.ejercicio != null ? String(row.ejercicio) : null}
                        type="select"
                        options={ejercicioOptions}
                        onSave={(v) =>
                          saveField(row.id, "ejercicio", v ? Number(v) : null)
                        }
                      />
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
    </div>
  );
}
