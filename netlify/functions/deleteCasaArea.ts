// netlify/functions/deleteCasaArea.ts
import type { Handler } from '@netlify/functions';
import {
  ensureConfig, serviceSupabase, json, parseBody, emptyOrNull,
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

    // CASCADE will remove junction rows automatically
    const { error } = await supabase
      .from('casa_areas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[deleteCasaArea]', error);
      return json({ error: error.message }, 500);
    }

    return json({ ok: true });
  } catch (e: any) {
    console.error('[deleteCasaArea] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
