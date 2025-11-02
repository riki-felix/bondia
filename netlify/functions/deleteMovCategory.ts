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

	// comprobar uso
	const { count, error: cErr } = await supabase.from('movimientos').select('id', { count: 'exact', head: true }).eq('categoria_id', id);
	if (cErr) return json({ error: cErr.message }, 500);
	if ((count || 0) > 0) return json({ error: 'Categoría en uso. Reasigna primero.' }, 409);

	const { error } = await supabase.from('movimiento_categorias').delete().eq('id', id);
	if (error) return json({ error: error.message }, 500);

	return ok();
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};