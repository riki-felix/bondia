import type { Handler } from '@netlify/functions';
import { json, ok, parseBody, ensureConfig, serviceSupabase, emptyOrNull } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	if (!id) return json({ error: 'id requerido' }, 400);

	const { error } = await supabase
	  .from('aportaciones')
	  .delete()
	  .eq('id', id);

	if (error) {
	  console.error('[aportacion-delete] Supabase error', error);
	  return json({ error: 'Error al eliminar aportación' }, 500);
	}

	return json({ ok: true });
  } catch (err: any) {
	console.error('[aportacion-delete] Error', err);
	return json({ error: err.message || String(err) }, 500);
  }
};