import type { SupabaseClient } from "@supabase/supabase-js";
import type { Property } from "./propertyTypes";
import { PROPERTY_SELECT } from "./propertyTypes";

export async function fetchInversionesWithLiquidaciones(
  supabase: SupabaseClient
): Promise<Property[]> {
  const { data: allProperties, error } = await supabase
    .from("propiedades")
    .select(PROPERTY_SELECT)
    .eq("tipo", "inversion")
    .order("numero_operacion", { ascending: true });

  if (error) throw error;

  const { data: allLiq } = await supabase
    .from("liquidaciones")
    .select(
      "propiedad_id, aportacion, retribucion, retencion, transferencia, efectivo, fecha_transferencia, ejercicio, liquidado"
    );

  const liqByProp = new Map<string, NonNullable<Property["liq"]>>();
  for (const l of allLiq ?? []) {
    liqByProp.set(l.propiedad_id, {
      aportacion: Number(l.aportacion) || 0,
      retribucion: Number(l.retribucion) || 0,
      retencion: Number(l.retencion) || 0,
      transferencia: Number(l.transferencia) || 0,
      efectivo: Number(l.efectivo) || 0,
      fecha_transferencia: l.fecha_transferencia ?? null,
      ejercicio: l.ejercicio ?? null,
      liquidado: l.liquidado === true,
    });
  }

  return (allProperties ?? []).map((p) => ({
    ...p,
    liq: liqByProp.get(p.id) ?? null,
  })) as Property[];
}

export function propertyIsLiquidada(row: Property): boolean {
  return row.liq?.liquidado === true || row.liquidacion === true;
}

export function propertyEjercicio(row: Property): number | null {
  return row.liq?.ejercicio ?? row.ejercicio ?? null;
}
