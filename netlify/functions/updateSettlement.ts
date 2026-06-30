// netlify/functions/updateSettlement.ts
// Proxy legacy → propiedades (tabla liquidaciones eliminada).
import type { Handler } from '@netlify/functions';
import {
  ensureConfig,
  serviceSupabase,
  json,
  parseBody,
  toMoneyOrNull,
  toDateOrNull,
  emptyOrNull,
  calcBrutoFromRetribucion,
  effectiveParticipacionSanyus,
} from './_shared';
import {
  applyPropiedadLiquidacionSideEffects,
  assertFinancialFieldsEditable,
} from './_inversionOperativa';
import {
  deriveEjercicioPropiedad,
  mergeEjercicioPropiedadInput,
  shouldAutoDeriveEjercicio,
} from './_ejercicioPropiedad';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const supabase = serviceSupabase();
    const body = parseBody(event.body);

    const id = emptyOrNull(body.id);
    if (!id) return json({ error: 'id requerido' }, 400);

    if (body.propiedad_id !== undefined) {
      return json({ error: 'No se puede cambiar la propiedad de una liquidación' }, 400);
    }

    const propUpdates: Record<string, unknown> = {};

    if (body.fecha_liquidacion !== undefined) {
      propUpdates.fecha_liquidacion = toDateOrNull(body.fecha_liquidacion);
    }
    if (body.aportacion !== undefined) {
      propUpdates.aportacion = toMoneyOrNull(body.aportacion) ?? 0;
    }
    if (body.retribucion !== undefined) {
      propUpdates.retribucion = toMoneyOrNull(body.retribucion) ?? 0;
    }
    if (body.transferencia !== undefined) {
      propUpdates.ingreso_banco = toMoneyOrNull(body.transferencia) ?? 0;
    }
    if (body.fecha_transferencia !== undefined) {
      propUpdates.fecha_transferencia = toDateOrNull(body.fecha_transferencia) ?? null;
    }
    if (body.fecha_aportacion !== undefined) {
      propUpdates.fecha_aportacion = toDateOrNull(body.fecha_aportacion) ?? null;
    }
    if (body.liquidado !== undefined) {
      const liquidado = body.liquidado === true;
      propUpdates.liquidacion = liquidado;
      propUpdates.liquidada_at = liquidado ? new Date().toISOString() : null;
    }
    if (body.ejercicio !== undefined) {
      const ej = body.ejercicio != null ? Number(body.ejercicio) : null;
      propUpdates.ejercicio = ej != null && Number.isFinite(ej) ? ej : null;
    }
    if (body.numero_operacion !== undefined) {
      const n = body.numero_operacion != null ? Number(body.numero_operacion) : null;
      propUpdates.numero_op_liquidacion =
        n != null && Number.isFinite(n) ? n : null;
    }

    if (Object.keys(propUpdates).length === 0) {
      return json({ ok: true, id });
    }

    const { data: propRow } = await supabase
      .from('propiedades')
      .select(
        'id, liquidacion, participacion_sanyus, ingreso_banco, fecha_venta, fecha_ingreso, fecha_liquidacion, created_at, ejercicio'
      )
      .eq('id', id)
      .maybeSingle();

    if (!propRow) return json({ error: 'Propiedad no encontrada' }, 404);

    if (propUpdates.retribucion !== undefined) {
      const retribucion = Number(propUpdates.retribucion) || 0;
      const pct = effectiveParticipacionSanyus(propRow.participacion_sanyus);
      propUpdates.beneficio_bruto =
        retribucion > 0 ? calcBrutoFromRetribucion(retribucion, pct) : 0;
    }

    if (
      propUpdates.fecha_transferencia &&
      !propRow.ingreso_banco &&
      propUpdates.ingreso_banco === undefined
    ) {
      propUpdates.fecha_ingreso = propUpdates.fecha_transferencia;
    }

    if (
      shouldAutoDeriveEjercicio(body, propUpdates)
    ) {
      const merged = mergeEjercicioPropiedadInput(
        {
          liquidacion: propRow.liquidacion,
          fecha_liquidacion: propRow.fecha_liquidacion,
          fecha_venta: propRow.fecha_venta,
          fecha_ingreso: propRow.fecha_ingreso,
          created_at: propRow.created_at,
        },
        {
          liquidacion: propUpdates.liquidacion as boolean | null | undefined,
          fecha_liquidacion: propUpdates.fecha_liquidacion as string | null | undefined,
          fecha_venta: propUpdates.fecha_venta as string | null | undefined,
          fecha_ingreso: propUpdates.fecha_ingreso as string | null | undefined,
        }
      );
      const derived = deriveEjercicioPropiedad(merged);
      if (derived != null) propUpdates.ejercicio = derived;
    }

    const lockErr = assertFinancialFieldsEditable(
      propRow,
      Object.keys(propUpdates),
      propUpdates
    );
    if (lockErr) return json({ error: lockErr }, 409);

    const { data, error } = await supabase
      .from('propiedades')
      .update(propUpdates)
      .eq('id', id)
      .select(
        'id, fecha_liquidacion, beneficio_bruto, aportacion, retribucion, ingreso_banco, fecha_transferencia, fecha_aportacion, liquidacion, ejercicio, numero_op_liquidacion'
      )
      .single();

    if (error) {
      console.error('[updateSettlement]', error);
      return json({ error: error.message }, 500);
    }

    await applyPropiedadLiquidacionSideEffects(supabase, id, propUpdates);

    return json({
      id: data.id,
      propiedad_id: data.id,
      fecha_liquidacion: data.fecha_liquidacion,
      beneficio_bruto: data.beneficio_bruto,
      aportacion: data.aportacion,
      retribucion: data.retribucion,
      transferencia: data.ingreso_banco,
      fecha_transferencia: data.fecha_transferencia,
      fecha_aportacion: data.fecha_aportacion,
      liquidado: data.liquidacion === true,
      ejercicio: data.ejercicio,
      numero_operacion: data.numero_op_liquidacion,
    });
  } catch (e: any) {
    console.error('[updateSettlement] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
