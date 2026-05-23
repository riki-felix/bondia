import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calcEfectivoFromTransfer,
  calcJaspAutoFromBruto,
  calcNeto,
  calcRetencion,
  calcRetribucionFromBruto,
  round2,
} from "./moneyCalc";
import {
  effectiveParticipacionJasp,
  effectiveParticipacionSanyus,
} from "./participacion";

/** Recalcula retribución de una liquidación desde su bruto y la participación de la propiedad */
export function recalcLiquidacionFromBruto(
  bruto: number,
  participacionSanyus: number | null | undefined
): number {
  return calcRetribucionFromBruto(
    bruto,
    effectiveParticipacionSanyus(participacionSanyus)
  );
}

export interface SettlementMoneyDerived {
  retribucion: number;
  retencion: number;
  neto: number;
  efectivo: number;
  /** true si retribución sale de bruto × % Sanyus */
  fromBruto: boolean;
}

/** Importes derivados: retribución desde bruto si hay bruto; si no, retribución almacenada */
export function deriveSettlementMoney(row: {
  beneficio_bruto: number | null;
  retribucion: number;
  transferencia: number;
  propiedad_participacion_sanyus?: number | null;
}): SettlementMoneyDerived {
  const bruto = Number(row.beneficio_bruto) || 0;
  const transferencia = Number(row.transferencia) || 0;

  const retribucion =
    bruto > 0
      ? recalcLiquidacionFromBruto(bruto, row.propiedad_participacion_sanyus)
      : round2(Number(row.retribucion) || 0);

  const retencion = calcRetencion(retribucion);
  const neto = calcNeto(retribucion);
  const efectivo = calcEfectivoFromTransfer(neto, transferencia);

  return {
    retribucion,
    retencion,
    neto,
    efectivo,
    fromBruto: bruto > 0,
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
      .select("beneficio_bruto, retribucion")
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

  let totalBruto = 0;
  let totalRetribucion = 0;
  for (const l of liqs ?? []) {
    totalBruto += Number(l.beneficio_bruto) || 0;
    totalRetribucion += Number(l.retribucion) || 0;
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

/** Recalcula retribución de todas las liquidaciones con bruto y sincroniza la propiedad */
export async function recalcLiquidacionesParticipacionPropiedad(
  supabase: SupabaseClient,
  propiedadId: string,
  participacionSanyus: number | null | undefined
): Promise<void> {
  const { data: liqs, error: listErr } = await supabase
    .from("liquidaciones")
    .select("id, beneficio_bruto")
    .eq("propiedad_id", propiedadId);

  if (listErr) throw listErr;

  for (const l of liqs ?? []) {
    const bruto = Number(l.beneficio_bruto) || 0;
    if (bruto <= 0) continue;
    const retribucion = recalcLiquidacionFromBruto(bruto, participacionSanyus);
    const { error } = await supabase
      .from("liquidaciones")
      .update({ retribucion })
      .eq("id", l.id);
    if (error) throw error;
  }

  await syncPropiedadFromLiquidaciones(supabase, propiedadId);
}
