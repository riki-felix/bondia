import { toNum, round2 } from "@/lib/moneyCalc";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface IngresoBancoPropiedadRow {
  estado: string | null;
  liquidacion: boolean;
  ingreso_banco: number | null;
  ejercicio: number | null;
  fecha_ingreso: string | null;
  created_at: string | null;
}

/** Año para filtrar: ejercicio de propiedad → fecha ingreso. */
export function yearForIngresoBancoFilter(
  row: Pick<IngresoBancoPropiedadRow, "ejercicio" | "fecha_ingreso" | "created_at">
): number | null {
  if (row.ejercicio != null) return row.ejercicio;
  const dateStr = row.fecha_ingreso || row.created_at;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.getFullYear();
}

export function effectiveIngresoBancoPropiedad(
  row: Pick<IngresoBancoPropiedadRow, "ingreso_banco">
): number {
  return toNum(row.ingreso_banco);
}

/** Suma transferencias (ingreso_banco) de inversiones por ejercicio. */
export function sumIngresosBancoPropiedades(
  propiedades: IngresoBancoPropiedadRow[],
  yearFilter: string
): { total: number; count: number } {
  let total = 0;
  let count = 0;

  for (const p of propiedades) {
    if (yearFilter !== "all") {
      const y = yearForIngresoBancoFilter(p);
      if (y == null || String(y) !== yearFilter) continue;
    }
    const amt = toNum(p.ingreso_banco);
    if (!amt) continue;
    total += amt;
    count += 1;
  }

  return { total: round2(total), count };
}

export async function loadIngresosBancoPropiedades(
  supabase: SupabaseClient
): Promise<IngresoBancoPropiedadRow[]> {
  const { data: props } = await supabase
    .from("propiedades")
    .select(
      "estado, liquidacion, ingreso_banco, ejercicio, fecha_ingreso, created_at"
    )
    .eq("tipo", "inversion");

  return (props ?? []).map((p) => ({
    estado: p.estado,
    liquidacion: p.liquidacion,
    ingreso_banco: p.ingreso_banco,
    ejercicio: p.ejercicio,
    fecha_ingreso: p.fecha_ingreso,
    created_at: p.created_at,
  }));
}

export function collectIngresosBancoYears(
  propiedades: IngresoBancoPropiedadRow[],
  fallbackYear: number
): number[] {
  const yearSet = new Set<number>();
  for (const p of propiedades) {
    const y = yearForIngresoBancoFilter(p);
    if (y != null) yearSet.add(y);
  }
  if (yearSet.size === 0) yearSet.add(fallbackYear);
  return Array.from(yearSet).sort((a, b) => b - a);
}
