// netlify/functions/createCasaActivo.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  toMoneyOrNull, toDateOrNull, emptyOrNull, slugifyEs,
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

    const nombre = emptyOrNull(body.nombre) ?? '';
    const slug = nombre ? slugifyEs(nombre) + '-' + Date.now() : 'activo-' + Date.now();

    const row = {
      nombre,
      categoria_id: emptyOrNull(body.categoria_id),
      fecha_compra: toDateOrNull(body.fecha_compra),
      precio_compra: toMoneyOrNull(body.precio_compra),
      slug,
    };

    const { data, error } = await supabase
      .from('casa_activos_v2')
      .insert(row)
      .select('*')
      .single();

    if (error) {
      console.error('[createCasaActivo]', error);
      return json({ error: error.message }, 500);
    }

    return json(data, 201);
  } catch (e: any) {
    console.error('[createCasaActivo] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
