import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "./propertyTypes";
import { PROPERTY_SELECT } from "./propertyTypes";

export async function fetchInversiones(
  supabase: SupabaseClient
): Promise<Property[]> {
  const { data, error } = await supabase
    .from("propiedades")
    .select(PROPERTY_SELECT)
    .eq("tipo", "inversion")
    .order("numero_operacion", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Property[];
}

export function propertyIsLiquidada(row: Property): boolean {
  return row.liquidacion === true;
}

export function propertyEjercicio(row: Property): number | null {
  return row.ejercicio ?? null;
}

export function collectInversionesYears(rows: Property[]): number[] {
  const yearSet = new Set<number>();
  for (const p of rows) {
    if (p.ejercicio != null) yearSet.add(p.ejercicio);
    const dateStr = p.fecha_ingreso || p.created_at;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!Number.isNaN(d.getTime())) yearSet.add(d.getFullYear());
    }
  }
  return Array.from(yearSet).sort((a, b) => b - a);
}
