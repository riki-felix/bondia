import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calcBrutoFromRetribucion,
  calcJaspFromBruto,
  derivePagoFromIngreso,
  effectiveParticipacionJasp,
  effectiveParticipacionSanyus,
  roundMoney2,
} from './_shared';

const LOCKED_FINANCIAL_FIELDS = new Set([
  'aportacion',
  'retribucion',
  'ingreso_banco',
  'beneficio_bruto',
  'jasp_10_percent',
  'fecha_aportacion',
  'fecha_transferencia',
  'fecha_liquidacion',
  'numero_op_liquidacion',
  'participacion_sanyus',
  'participacion_jasp',
  'transferencia',
]);

export function assertFinancialFieldsEditable(
  prop: { liquidacion?: boolean | null },
  updateKeys: string[],
  updates: Record<string, unknown> = {}
): string | null {
  if (prop.liquidacion !== true) return null;
  if (updates.liquidacion === false) return null;
  if (updates.liquidacion === true) return null;
  for (const key of updateKeys) {
    if (LOCKED_FINANCIAL_FIELDS.has(key)) {
      return 'La operación está liquidada: los importes financieros están bloqueados';
    }
  }
  return null;
}

export async function recalcBrutoYJaspPropiedad(
  supabase: SupabaseClient,
  propiedadId: string
): Promise<void> {
  const { data: prop } = await supabase
    .from('propiedades')
    .select(
      'participacion_sanyus, participacion_jasp, jasp_manual, retribucion, beneficio_bruto'
    )
    .eq('id', propiedadId)
    .single();

  if (!prop) return;

  const pctSanyus = effectiveParticipacionSanyus(prop.participacion_sanyus);
  const retribucion = Number(prop.retribucion) || 0;
  const bruto =
    Number(prop.beneficio_bruto) > 0
      ? roundMoney2(Number(prop.beneficio_bruto))
      : retribucion > 0
        ? calcBrutoFromRetribucion(retribucion, pctSanyus)
        : 0;

  const propUpdates: Record<string, unknown> = {
    beneficio_bruto: bruto,
  };

  if (!prop.jasp_manual) {
    propUpdates.jasp_10_percent = calcJaspFromBruto(
      bruto,
      effectiveParticipacionJasp(prop.participacion_jasp)
    );
    propUpdates.jasp_manual = false;
  }

  await supabase.from('propiedades').update(propUpdates).eq('id', propiedadId);
}

export async function applyPropiedadLiquidacionSideEffects(
  supabase: SupabaseClient,
  propiedadId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const needsRecalc =
    updates.retribucion !== undefined ||
    updates.beneficio_bruto !== undefined ||
    updates.participacion_sanyus !== undefined ||
    updates.participacion_jasp !== undefined;

  if (needsRecalc) {
    await recalcBrutoYJaspPropiedad(supabase, propiedadId);
  }

  if (updates.liquidacion !== undefined || updates.ingreso_banco !== undefined) {
    const { data: prop } = await supabase
      .from('propiedades')
      .select('ingreso_banco, liquidacion')
      .eq('id', propiedadId)
      .single();

    if (prop) {
      await supabase
        .from('propiedades')
        .update({
          pago: derivePagoFromIngreso(prop.ingreso_banco),
        })
        .eq('id', propiedadId);
    }
  }
}
