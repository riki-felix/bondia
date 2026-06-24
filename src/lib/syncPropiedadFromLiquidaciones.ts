import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calcBrutoFromRetribucion,
  calcEfectivoFromTransfer,
  calcJaspAutoFromBruto,
  calcNeto,
  calcRetencion,
  round2,
} from "./moneyCalc";
import {
  effectiveParticipacionJasp,
  effectiveParticipacionSanyus,
} from "./participacion";

export interface SettlementBrutoInput {
  retribucion: number;
  propiedad_participacion_sanyus?: number | null;
}

/** Bruto derivado de retribución y % Sanyus de la propiedad */
export function deriveBrutoFromRetribucion(row: SettlementBrutoInput): number {
  const retribucion = round2(Number(row.retribucion) || 0);
  if (retribucion <= 0) return 0;
  return calcBrutoFromRetribucion(
    retribucion,
    effectiveParticipacionSanyus(row.propiedad_participacion_sanyus)
  );
}

export interface SettlementMoneyDerived {
  retribucion: number;
  retencion: number;
  neto: number;
  efectivo: number;
}

/** Importes derivados desde retribución almacenada (retención, neto, efectivo) */
export function deriveSettlementMoney(row: {
  retribucion: number;
  transferencia: number;
}): SettlementMoneyDerived {
  const retribucion = round2(Number(row.retribucion) || 0);
  const transferencia = Number(row.transferencia) || 0;

  const retencion = calcRetencion(retribucion);
  const neto = calcNeto(retribucion);
  const efectivo = calcEfectivoFromTransfer(neto, transferencia);

  return {
    retribucion,
    retencion,
    neto,
    efectivo,
  };
}

/** Sincroniza retribución y JASP de la propiedad desde sus liquidaciones */
export async function syncPropiedadFromLiquidaciones(
  supabase: SupabaseClient,
  propiedadId: string
): Promise<void> {
  const [{ data: liqs }, { data: prop }] = await Promise.all([
    supabase
      .from("liquidaciones")
      .select("retribucion")
      .eq("propiedad_id", propiedadId),
    supabase
      .from("propiedades")
      .select(
        "participacion_sanyus, participacion_jasp, jasp_manual, jasp_10_percent"
      )
      .eq("id", propiedadId)
      .single(),
  ]);

  if (!prop) return;

  const pctSanyus = effectiveParticipacionSanyus(prop.participacion_sanyus);

  let totalBruto = 0;
  let totalRetribucion = 0;
  for (const l of liqs ?? []) {
    const retribucion = Number(l.retribucion) || 0;
    totalRetribucion += retribucion;
    totalBruto += calcBrutoFromRetribucion(retribucion, pctSanyus);
  }

  const updates: Record<string, unknown> = {
    retribucion: round2(totalRetribucion),
  };

  if (!prop.jasp_manual) {
    updates.jasp_10_percent = calcJaspAutoFromBruto(
      totalBruto,
      effectiveParticipacionJasp(prop.participacion_jasp)
    );
    updates.jasp_manual = false;
  }

  const { error } = await supabase
    .from("propiedades")
    .update(updates)
    .eq("id", propiedadId);

  if (error) throw error;
}

/** Recalcula bruto de todas las liquidaciones al cambiar % Sanyus; retribución no cambia */
export async function recalcLiquidacionesBrutoPropiedad(
  supabase: SupabaseClient,
  propiedadId: string,
  participacionSanyus: number | null | undefined
): Promise<void> {
  const pct = effectiveParticipacionSanyus(participacionSanyus);
  const { data: liqs, error: listErr } = await supabase
    .from("liquidaciones")
    .select("id, retribucion")
    .eq("propiedad_id", propiedadId);

  if (listErr) throw listErr;

  for (const l of liqs ?? []) {
    const retribucion = Number(l.retribucion) || 0;
    const beneficio_bruto =
      retribucion > 0 ? calcBrutoFromRetribucion(retribucion, pct) : 0;
    const { error } = await supabase
      .from("liquidaciones")
      .update({ beneficio_bruto })
      .eq("id", l.id);
    if (error) throw error;
  }

  await syncPropiedadFromLiquidaciones(supabase, propiedadId);
}

/** @deprecated Usar recalcLiquidacionesBrutoPropiedad */
export const recalcLiquidacionesParticipacionPropiedad =
  recalcLiquidacionesBrutoPropiedad;
