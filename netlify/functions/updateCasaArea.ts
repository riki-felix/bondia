// netlify/functions/updateCasaArea.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody,
  emptyOrNull, slugifyEs,
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

    const nombre = emptyOrNull(body.nombre);
    if (!nombre) return json({ error: 'nombre requerido' }, 400);

    const slug = slugifyEs(nombre);

    const { data, error } = await supabase
      .from('casa_areas')
      .update({ nombre, slug })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[updateCasaArea]', error);
      return json({ error: error.message }, 500);
    }

    return json(data);
  } catch (e: any) {
    console.error('[updateCasaArea] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
