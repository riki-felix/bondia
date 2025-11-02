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

	// Borra objetos del bucket movement-docs bajo <id>/
	// 1) lista
	const { data: objs, error: listErr } = await supabase.storage.from('movement-docs')
	  .list(id, { limit: 1000, search: '' });
	if (listErr) return json({ error: listErr.message }, 500);
	if (objs && objs.length) {
	  const paths = objs.map(o => `${id}/${o.name}`);
	  const { error: rmErr } = await supabase.storage.from('movement-docs').remove(paths);
	  if (rmErr) return json({ error: rmErr.message }, 500);
	}

	// Borra mapeos
	const { error: mapErr } = await supabase.from('movimiento_tag_map').delete().eq('movimiento_id', id);
	if (mapErr) return json({ error: mapErr.message }, 500);

	// Borra movimiento
	const { error } = await supabase.from('movimientos').delete().eq('id', id);
	if (error) return json({ error: error.message }, 500);

	return ok();
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};