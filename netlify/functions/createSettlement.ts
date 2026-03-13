// netlify/functions/createSettlement.ts
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

    const propiedad_id = emptyOrNull(body.propiedad_id);
    if (!propiedad_id) return json({ error: 'propiedad_id requerido' }, 400);

    const fecha_liquidacion = toDateOrNull(body.fecha_liquidacion);
    if (!fecha_liquidacion) return json({ error: 'fecha_liquidacion requerida (YYYY-MM-DD)' }, 400);

    // Auto-generate numero_liquidacion if not provided
    let numero_liquidacion = body.numero_liquidacion;
    if (numero_liquidacion == null) {
      const { data: maxRow } = await supabase
        .from('liquidaciones')
        .select('numero_liquidacion')
        .eq('propiedad_id', propiedad_id)
        .order('numero_liquidacion', { ascending: false })
        .limit(1);

      numero_liquidacion = (maxRow?.[0]?.numero_liquidacion ?? 0) + 1;
    }

    const ejercicio = body.ejercicio != null ? Number(body.ejercicio) : null;

    const row = {
      propiedad_id,
      fecha_liquidacion,
      numero_liquidacion: Number(numero_liquidacion),
      numero_operacion: body.numero_operacion != null ? Number(body.numero_operacion) : null,
      aportacion: toMoneyOrNull(body.aportacion) ?? 0,
      retribucion: toMoneyOrNull(body.retribucion) ?? 0,
      transferencia: toMoneyOrNull(body.transferencia) ?? 0,
      fecha_transferencia: toDateOrNull(body.fecha_transferencia) ?? null,
      fecha_aportacion: toDateOrNull(body.fecha_aportacion) ?? null,
      liquidado: body.liquidado === true,
      ejercicio: Number.isFinite(ejercicio) ? ejercicio : null,
    };

    const { data, error } = await supabase
      .from('liquidaciones')
      .insert(row)
      .select('id, propiedad_id, fecha_liquidacion, numero_liquidacion, numero_operacion, aportacion, retribucion, retencion, neto, efectivo, transferencia, fecha_transferencia, fecha_aportacion, liquidado, ejercicio')
      .single();

    if (error) {
      console.error('[createSettlement]', error);
      return json({ error: error.message }, 500);
    }

    return json(data, 201);
  } catch (e: any) {
    console.error('[createSettlement] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
