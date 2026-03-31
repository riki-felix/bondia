// netlify/functions/deleteCasaGasto.ts
import type { Handler } from '@netlify/functions';
import { ensureConfig, serviceSupabase, json, ok, parseBody, emptyOrNull } from './_shared';

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

    // Overrides are deleted via CASCADE
    const { error } = await supabase.from('casa_gastos').delete().eq('id', id);

    if (error) {
      console.error('[deleteCasaGasto]', error);
      return json({ error: error.message }, 500);
    }

    return ok();
  } catch (e: any) {
    console.error('[deleteCasaGasto] fatal:', e);
    return json({ error: e.message || 'Error inesperado' }, 500);
  }
};
