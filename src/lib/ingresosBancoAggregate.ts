import { toNum } from "@/lib/moneyCalc";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Fila de liquidación (misma fuente que /liquidaciones). */
export interface IngresoBancoLiquidacionRow {
  transferencia: number | null;
  ejercicio: number | null;
}

/** Propiedad de inversión con overlay de liquidaciones liquidadas. */
export interface IngresoBancoPropiedadRow {
  estado: string | null;
  liquidacion: boolean;
  ingreso_banco: number | null;
  ejercicio: number | null;
  fecha_ingreso: string | null;
  created_at: string | null;
  liqTransferencia?: number | null;
  liqEjercicio?: number | null;
}

/** Año para filtrar: ejercicio de propiedad → ejercicio liquidación → fecha ingreso. */
export function yearForIngresoBancoFilter(
  row: Pick<
    IngresoBancoPropiedadRow,
    "ejercicio" | "fecha_ingreso" | "created_at" | "liqEjercicio"
  >
): number | null {
  if (row.ejercicio != null) return row.ejercicio;
  if (row.liqEjercicio != null) return row.liqEjercicio;
  const dateStr = row.fecha_ingreso || row.created_at;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

/**
 * Importe a mostrar por propiedad: transferencia liquidada si existe; si no, ingreso en propiedad.
 * (p. ej. Pedraforca tiene liquidación en tabla pero `liquidacion=false` en la propiedad.)
 */
export function effectiveIngresoBancoPropiedad(
  row: Pick<IngresoBancoPropiedadRow, "ingreso_banco" | "liqTransferencia">
): number {
  const liqAmt = toNum(row.liqTransferencia);
  if (liqAmt > 0) return liqAmt;
  return toNum(row.ingreso_banco);
}

/**
 * Total global de transferencias = suma de filas en `liquidaciones` (como /liquidaciones).
 * Coincide con el widget «Total Transferencias» y la fila de totales de la tabla.
 */
export function sumTransferenciasLiquidaciones(
  liquidaciones: IngresoBancoLiquidacionRow[],
  yearFilter: string
): { total: number; count: number } {
  let total = 0;
  let count = 0;

  for (const liq of liquidaciones) {
    if (yearFilter !== "all") {
      if (liq.ejercicio == null || String(liq.ejercicio) !== yearFilter) continue;
    }
    const amt = toNum(liq.transferencia);
    if (!amt) continue;
    total += amt;
    count += 1;
  }

  return { total: Math.round(total * 100) / 100, count };
}

/** @deprecated Usar sumTransferenciasLiquidaciones para totales globales. */
export function sumIngresosBanco(
  liquidaciones: IngresoBancoLiquidacionRow[],
  _propiedades: IngresoBancoPropiedadRow[],
  yearFilter: string
): { total: number; count: number } {
  return sumTransferenciasLiquidaciones(liquidaciones, yearFilter);
}

/** Carga propiedades de inversión con overlay de liquidaciones liquidadas. */
export async function loadIngresosBancoPropiedades(
  supabase: SupabaseClient
): Promise<IngresoBancoPropiedadRow[]> {
  const [{ data: props }, { data: liqRows }] = await Promise.all([
    supabase
      .from("propiedades")
      .select(
        "id, estado, liquidacion, ingreso_banco, ejercicio, fecha_ingreso, created_at"
      )
      .eq("tipo", "inversion"),
    supabase
      .from("liquidaciones")
      .select("propiedad_id, transferencia, ejercicio")
      .eq("liquidado", true),
  ]);

  const liqByProp = new Map<
    string,
    { transferencia: number; ejercicio: number | null }
  >();
  for (const l of liqRows ?? []) {
    const pid = l.propiedad_id as string;
    const existing = liqByProp.get(pid) ?? {
      transferencia: 0,
      ejercicio: null as number | null,
    };
    existing.transferencia += Number(l.transferencia) || 0;
    if (l.ejercicio != null) existing.ejercicio = l.ejercicio;
    liqByProp.set(pid, existing);
  }

  return (props ?? []).map((p) => {
    const liq = liqByProp.get(p.id as string);
    return {
      estado: p.estado,
      liquidacion: p.liquidacion,
      ingreso_banco: p.ingreso_banco,
      ejercicio: p.ejercicio,
      fecha_ingreso: p.fecha_ingreso,
      created_at: p.created_at,
      liqTransferencia: liq?.transferencia ?? null,
      liqEjercicio: liq?.ejercicio ?? null,
    };
  });
}

export function collectIngresosBancoYears(
  liquidaciones: IngresoBancoLiquidacionRow[],
  propiedades: IngresoBancoPropiedadRow[],
  fallbackYear: number
): number[] {
  const yearSet = new Set<number>();
  for (const l of liquidaciones) {
    if (l.ejercicio != null) yearSet.add(l.ejercicio);
  }
  for (const p of propiedades) {
    const y = yearForIngresoBancoFilter(p);
    if (y != null) yearSet.add(y);
  }
  if (yearSet.size === 0) yearSet.add(fallbackYear);
  return Array.from(yearSet).sort((a, b) => b - a);
}
