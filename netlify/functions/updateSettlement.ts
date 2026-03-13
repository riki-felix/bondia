// netlify/functions/updateSettlement.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig,
  serviceSupabase,
  json,
  parseBody,
  toMoneyOrNull,
  toDateOrNull,
  emptyOrNull,
} from './_shared';

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

    const updates: Record<string, unknown> = {};

    if (body.propiedad_id !== undefined) {
      const v = emptyOrNull(body.propiedad_id);
      if (!v) return json({ error: 'propiedad_id inválido' }, 400);
      updates.propiedad_id = v;
    }

    if (body.fecha_liquidacion !== undefined) {
      const v = toDateOrNull(body.fecha_liquidacion);
      if (!v) return json({ error: 'fecha_liquidacion inválida' }, 400);
      updates.fecha_liquidacion = v;
    }

    if (body.numero_liquidacion !== undefined) {
      const n = Number(body.numero_liquidacion);
      if (!Number.isFinite(n)) return json({ error: 'numero_liquidacion inválido' }, 400);
      updates.numero_liquidacion = n;
    }

    if (body.numero_operacion !== undefined) {
      const n = body.numero_operacion != null ? Number(body.numero_operacion) : null;
      updates.numero_operacion = n != null && Number.isFinite(n) ? n : null;
    }
    if (body.aportacion !== undefined) updates.aportacion = toMoneyOrNull(body.aportacion) ?? 0;
    if (body.retribucion !== undefined) updates.retribucion = toMoneyOrNull(body.retribucion) ?? 0;
    if (body.transferencia !== undefined) updates.transferencia = toMoneyOrNull(body.transferencia) ?? 0;
    if (body.fecha_transferencia !== undefined) updates.fecha_transferencia = toDateOrNull(body.fecha_transferencia) ?? null;
    if (body.fecha_aportacion !== undefined) updates.fecha_aportacion = toDateOrNull(body.fecha_aportacion) ?? null;
    if (body.liquidado !== undefined) updates.liquidado = body.liquidado === true;
    if (body.ejercicio !== undefined) {
      const ej = body.ejercicio != null ? Number(body.ejercicio) : null;
      updates.ejercicio = ej != null && Number.isFinite(ej) ? ej : null;
    }

    if (Object.keys(updates).length === 0) {
      return json({ ok: true, id });
    }

    const { data, error } = await supabase
      .from('liquidaciones')
      .update(updates)
      .eq('id', id)
      .select('id, propiedad_id, fecha_liquidacion, numero_liquidacion, numero_operacion, aportacion, retribucion, retencion, neto, efectivo, transferencia, fecha_transferencia, fecha_aportacion, liquidado, ejercicio')
      .single();

    if (error) {
      console.error('[updateSettlement]', error);
      return json({ error: error.message }, 500);
    }

    return json(data);
  } catch (e: any) {
    console.error('[updateSettlement] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
