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

	// borra mapeos N:M (ON DELETE CASCADE ya lo hace, pero explícito por claridad)
	await supabase.from('movimiento_tag_map').delete().eq('tag_id', id);

	const { error } = await supabase.from('movimiento_tags').delete().eq('id', id);
	if (error) return json({ error: error.message }, 500);

	return ok();
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};