import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  parseBody,
  ensureConfig,
  serviceSupabase,
  emptyOrNull,
} from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	const del = body.delete === true;

	if (del) {
	  if (!id) return json({ error: 'id requerido para borrar' }, 400);
	  const { error } = await supabase
		.from('rds_pisos')
		.delete()
		.eq('id', id);
	  if (error) return json({ error: error.message }, 500);
	  return json({ ok: true, deleted: id });
	}

	const nombre = emptyOrNull(body.nombre);
	const direccion = emptyOrNull(body.direccion);
	const fecha_creacion = emptyOrNull(body.fecha_creacion);

	if (!nombre) return json({ error: 'nombre requerido' }, 400);

	if (!id) {
	  // crear
	  const { data, error } = await supabase
		.from('rds_pisos')
		.insert(
		  [
			{
			  nombre,
			  direccion,
			  fecha_creacion,
			},
		  ],
		)
		.select('id')
		.single();

	  if (error) return json({ error: error.message }, 500);
	  return json({ ok: true, id: data.id });
	}

	// actualizar
	const { error } = await supabase
	  .from('rds_pisos')
	  .update({
		nombre,
		direccion,
		fecha_creacion,
	  })
	  .eq('id', id);

	if (error) return json({ error: error.message }, 500);
	return json({ ok: true, id });
  } catch (err: any) {
	console.error('rds_piso_save error', err);
	return json({ error: err?.message || 'Unexpected error' }, 500);
  }
};