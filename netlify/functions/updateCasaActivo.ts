// netlify/functions/updateCasaActivo.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  toMoneyOrNull, toDateOrNull, emptyOrNull,
} from './_shared';

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

    if (body.nombre !== undefined) updates.nombre = emptyOrNull(body.nombre) ?? '';
    if (body.categoria_id !== undefined) updates.categoria_id = emptyOrNull(body.categoria_id);
    if (body.fecha_compra !== undefined) updates.fecha_compra = toDateOrNull(body.fecha_compra);
    if (body.precio_compra !== undefined) updates.precio_compra = toMoneyOrNull(body.precio_compra);

    if (Object.keys(updates).length === 0) return json({ ok: true, id });

    const { data, error } = await supabase
      .from('casa_activos_v2')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[updateCasaActivo]', error);
      return json({ error: error.message }, 500);
    }

    return json(data);
  } catch (e: any) {
    console.error('[updateCasaActivo] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
