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
  recalcProperty,
  formatEuro,
  sumColumn,
  toNum,
} from "@/lib/moneyCalc";
import {
  type Property,
  ESTADO_OPTIONS,
  PAGO_OPTIONS,
  OCUPADO_OPTIONS,
} from "@/lib/propertyTypes";
import { Plus, Archive, Trash2, Pencil, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PropertyDialog } from "./PropertyDialog";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

// ─── Props ───────────────────────────────────────────────────

interface InversionesTableProps {
  initialData: Property[];
  years: number[];
  initialYear: number | null;
}

// ─── Main Component ──────────────────────────────────────────

export default function InversionesTable({
  initialData,
  years,
  initialYear,
}: InversionesTableProps) {
  const [rows, setRows] = useState<Property[]>(initialData);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showLiquidadas, setShowLiquidadas] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [yearFilter, setYearFilter] = useState<string>(
    initialYear != null ? String(initialYear) : "all"
  );

  // ── Filtering ──
  const isArchived = (r: Property) =>
    r.numero_operacion == null && r.estado === "sin_estado";

  const archivedCount = useMemo(
    () => rows.filter(isArchived).length,
    [rows]
  );

  const liquidadasCount = useMemo(
    () => rows.filter((r) => !!r.liq).length,
    [rows]
  );

  const filteredRows = useMemo(() => {
    let result = rows;

    // Archive vs active split
    if (showArchive) {
      result = result.filter(isArchived);
    } else {
      result = result.filter((r) => !isArchived(r));
    }

    // Liquidadas filter
    if (showLiquidadas) {
      result = result.filter((r) => !!r.liq);
    }

    // Year filter (skip when viewing archive)
    if (!showArchive && yearFilter !== "all") {
      const y = Number(yearFilter);
      result = result.filter((r) => {
        // Match by liq ejercicio if available, otherwise by fecha_ingreso
        if (r.liq?.ejercicio != null) return r.liq.ejercicio === y;
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
  }, [rows, yearFilter, search, showArchive, showLiquidadas]);

  // ── Totals ──
  const totals = useMemo(() => {
    const moneyFields = [
      "aportacion",
      "retribucion",
      "retencion",
      "ingreso_banco",
      "efectivo",
      "jasp_10_percent",
    ] as const;
    const result: Record<string, number> = {};
    for (const f of moneyFields) {
      result[f] = sumColumn(filteredRows as unknown as Record<string, unknown>[], f);
    }
    return result;
  }, [filteredRows]);

  // ── Save single field ──
  const saveField = useCallback(
    async (id: string, field: string, value: unknown) => {
      // Optimistic update
      setRows((prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const updated = { ...r, [field]: value };

          // Recalculate dependent fields when inputs change
          if (
            field === "retribucion" ||
            field === "ingreso_banco"
          ) {
            const retribucion = toNum(
              field === "retribucion" ? value : r.retribucion
            );
            const ingreso_banco = toNum(
              field === "ingreso_banco" ? value : r.ingreso_banco
            );
            const calc = recalcProperty({ retribucion, ingreso_banco });
            Object.assign(updated, calc);
          }

          return updated;
        })
      );

      // Build the update payload
      const payload: Record<string, unknown> = { [field]: value };

      // If it's a trigger for calculated fields, include those too
      const row = rows.find((r) => r.id === id);
      if (row && (field === "retribucion" || field === "ingreso_banco")) {
        const retribucion = toNum(
          field === "retribucion" ? value : row.retribucion
        );
        const ingreso_banco = toNum(
          field === "ingreso_banco" ? value : row.ingreso_banco
        );
        const calc = recalcProperty({ retribucion, ingreso_banco });
        Object.assign(payload, calc);
      }

      try {
        const supabase = getSupabase();
        const { error } = await supabase
          .from("propiedades")
          .update(payload)
          .eq("id", id);

        if (error) throw error;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Error al guardar";
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
    const supabase = getSupabase();
    const { data: fresh } = await supabase
      .from("propiedades")
      .select(
        "id, numero_operacion, titulo, estado, created_at, pago, aportacion, retribucion, retencion, ingreso_banco, efectivo, jasp_10_percent, transfe, fecha_compra, fecha_venta, ocupado, notas, liquidacion, fecha_ingreso, slug"
      )
      .eq("tipo", "inversion")
      .order("numero_operacion", { ascending: true });

    if (fresh) setRows(fresh as Property[]);
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
          variant={showArchive ? "default" : "outline"}
          onClick={() => setShowArchive((v) => !v)}
        >
          <Archive className="h-4 w-4 mr-1" />
          Archivo{archivedCount > 0 ? ` (${archivedCount})` : ""}
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
              <TableHead className="min-w-[50px] max-w-[50px] sticky left-0 z-30 bg-muted">ID</TableHead>
              <TableHead className="min-w-[200px] sticky left-[50px] z-30 bg-muted shadow-[4px_0_4px_-4px_rgba(0,0,0,0.15)]">NOMBRE</TableHead>
              <TableHead className="w-[110px]">ESTADO</TableHead>
              <TableHead className="w-[120px]">FECHA INICIO</TableHead>
              <TableHead className="w-[100px]">PAGO</TableHead>
              <TableHead className="w-[120px] text-right">
                APORTACIÓN
              </TableHead>
              <TableHead className="w-[120px] text-right">
                RETRIBUCIÓN
              </TableHead>
              <TableHead className="w-[120px] text-right">
                RETENCIÓN
              </TableHead>
              <TableHead className="w-[130px] text-right bg-yellow-50">
                INGRESO BANCO
              </TableHead>
              <TableHead className="w-[110px] text-right">
                EFECTIVO
              </TableHead>
              <TableHead className="w-[100px] text-right">
                JASP 20%
              </TableHead>
              <TableHead className="w-[110px]">TRANSFE</TableHead>
              <TableHead className="w-[120px]">FECHA COMPRA</TableHead>
              <TableHead className="w-[120px]">FECHA VENTA</TableHead>
              <TableHead className="w-[80px]">OCUPADO</TableHead>
              <TableHead className="w-[90px]">LIQUIDADA</TableHead>
              <TableHead className="min-w-[150px]">NOTAS</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>

            {/* ── Totals row ── */}
            <TableRow className="bg-background font-semibold border-b-2">
              <TableCell className="min-w-[50px] max-w-[50px] sticky left-0 z-30 bg-background" />
              <TableCell className="sticky left-[50px] z-30 bg-background shadow-[4px_0_4px_-4px_rgba(0,0,0,0.15)]" />
              <TableCell colSpan={3} />
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
              <TableCell colSpan={7} />
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
                const isLiq = !!row.liq;
                // Use liquidación values when available
                const displayAportacion = isLiq ? row.liq!.aportacion : row.aportacion;
                const displayRetribucion = isLiq ? row.liq!.retribucion : row.retribucion;
                const displayRetencion = isLiq ? row.liq!.retencion : row.retencion;
                const displayIngresoBanco = isLiq ? row.liq!.transferencia : row.ingreso_banco;
                const displayEfectivo = isLiq ? row.liq!.efectivo : row.efectivo;

                // Per-year sequential ID when a year is selected; global numero_operacion otherwise
                const displayId = yearFilter !== "all" ? idx + 1 : row.numero_operacion;

                return (
                <TableRow key={row.id} className={isLiq ? "bg-green-50/40" : ""}>
                  {/* ID */}
                  <TableCell className={`text-sm font-medium tabular-nums min-w-[50px] max-w-[50px] sticky left-0 z-10 ${isLiq ? "bg-green-50" : "bg-background"}`}>
                    {displayId ?? "—"}
                  </TableCell>

                  {/* NOMBRE */}
                  <TableCell className={`sticky left-[50px] z-10 shadow-[4px_0_4px_-4px_rgba(0,0,0,0.15)] ${isLiq ? "bg-green-50" : "bg-background"}`}>
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

                  {/* PAGO */}
                  <TableCell>
                    <EditableCell
                      value={row.pago ? "true" : "false"}
                      type="select"
                      options={[...PAGO_OPTIONS]}
                      onSave={(v) =>
                        saveField(
                          row.id,
                          "pago",
                          v === "true"
                        )
                      }
                    />
                  </TableCell>

                  {/* APORTACIÓN */}
                  <TableCell>
                    {isLiq ? (
                      <EditableCell value={displayAportacion} type="readonly-money" onSave={() => {}} />
                    ) : (
                      <EditableCell
                        value={row.aportacion}
                        type="money"
                        onSave={(v) => saveField(row.id, "aportacion", v)}
                      />
                    )}
                  </TableCell>

                  {/* RETRIBUCIÓN */}
                  <TableCell>
                    {isLiq ? (
                      <EditableCell value={displayRetribucion} type="readonly-money" onSave={() => {}} />
                    ) : (
                      <EditableCell
                        value={row.retribucion}
                        type="money"
                        onSave={(v) => saveField(row.id, "retribucion", v)}
                      />
                    )}
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
                    {isLiq ? (
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

                  {/* JASP 20% (calculated from propiedades.ingreso_banco) */}
                  <TableCell>
                    <EditableCell
                      value={row.jasp_10_percent}
                      type="readonly-money"
                      onSave={() => {}}
                    />
                  </TableCell>

                  {/* TRANSFE (date — from liquidación if available) */}
                  <TableCell>
                    {isLiq && row.liq!.fecha_transferencia ? (
                      <span className="text-sm tabular-nums">
                        {new Date(row.liq!.fecha_transferencia).toLocaleDateString("es-ES")}
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

                  {/* LIQUIDADA */}
                  <TableCell className="text-center">
                    {isLiq ? (
                      <Badge variant="success" className="text-xs">Sí</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
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
