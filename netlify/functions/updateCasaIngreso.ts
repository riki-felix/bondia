// netlify/functions/updateCasaIngreso.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  toMoneyOrNull, toDateOrNull, emptyOrNull, pickFrom,
} from './_shared';

const FREQ = new Set([
  'semanal','quincenal','mensual','bimensual',
  'trimestral','semestral','anual','puntual','variable',
]);

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    ensureConfig();
    const supabase = serviceSupabase();
    const body = parseBody(event.body);

    const id = emptyOrNull(body.id);
    if (!id) return json({ error: 'id requerido' }, 400);

    const updates: Record<string, unknown> = {};

    if (body.concepto !== undefined) updates.concepto = emptyOrNull(body.concepto) ?? '';
    if (body.categoria_id !== undefined) updates.categoria_id = emptyOrNull(body.categoria_id);
    if (body.frecuencia !== undefined) {
      const f = pickFrom(body.frecuencia, FREQ);
      if (f) updates.frecuencia = f;
    }
    if (body.fecha_inicio !== undefined) updates.fecha_inicio = toDateOrNull(body.fecha_inicio);
    if (body.fecha_fin !== undefined) updates.fecha_fin = toDateOrNull(body.fecha_fin);
    if (body.importe !== undefined) updates.importe = toMoneyOrNull(body.importe) ?? 0;
    if (body.ejercicio !== undefined) {
      const ej = Number(body.ejercicio);
      if (Number.isFinite(ej)) updates.ejercicio = ej;
    }

    if (Object.keys(updates).length === 0) return json({ ok: true, id });

    const { data, error } = await supabase
      .from('casa_ingresos')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[updateCasaIngreso]', error);
      return json({ error: error.message }, 500);
    }

    return json(data);
  } catch (e: any) {
    console.error('[updateCasaIngreso] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
