import type { Handler } from '@netlify/functions';
import { json, ok, parseBody, ensureConfig, serviceSupabase, emptyOrNull, slugifyEs } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	const nombre = emptyOrNull(body.nombre);
	if (!id || !nombre) return json({ error: 'id y nombre requeridos' }, 400);

	const slug = slugifyEs(nombre);
	const { data, error } = await supabase.from('movimiento_tags').update({ nombre, slug }).eq('id', id).select('id, nombre, slug').single();
	if (error) return json({ error: error.message }, 500);

	return json(data, 200);
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};