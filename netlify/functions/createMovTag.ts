import type { Handler } from '@netlify/functions';
import { json, ok, parseBody, ensureConfig, serviceSupabase, emptyOrNull, slugifyEs } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const nombre = emptyOrNull(body.nombre);
	if (!nombre) return json({ error: 'nombre requerido' }, 400);

	const slug = slugifyEs(nombre);
	const { data, error } = await supabase.from('movimiento_tags').insert({ nombre, slug }).select('id, nombre, slug').single();
	if (error) return json({ error: error.message }, 500);

	return json(data, 201);
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};