import type { SupabaseClient } from "@supabase/supabase-js";

/** Sincroniza ejercicio y flag liquidada de la propiedad desde su liquidación (1:1). */
export async function syncPropiedadFromLiquidacionMetadata(
  supabase: SupabaseClient,
  propiedadId: string
): Promise<void> {
  const { data: liq, error: liqErr } = await supabase
    .from("liquidaciones")
    .select("ejercicio, liquidado")
    .eq("propiedad_id", propiedadId)
    .maybeSingle();

  if (liqErr) throw liqErr;
  if (!liq) return;

  const updates: Record<string, unknown> = {
    liquidacion: liq.liquidado === true,
  };
  if (liq.ejercicio != null) {
    updates.ejercicio = liq.ejercicio;
  }

  const { error } = await supabase
    .from("propiedades")
    .update(updates)
    .eq("id", propiedadId);

  if (error) throw error;
}
