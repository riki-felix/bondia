// netlify/functions/rds_piso_save.ts
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
	const isDelete = body.delete === true || body.delete === 'true';

	// ---------------- DELETE ----------------
	if (isDelete) {
	  if (!id) {
		return json({ error: 'id requerido para borrar' }, 400);
	  }

	  // Primero borramos movimientos asociados
	  const { error: movErr } = await supabase
		.from('rds_movimientos')
		.delete()
		.eq('piso_id', id);

	  if (movErr) {
		return json({ error: movErr.message }, 500);
	  }

	  // Luego el piso
	  const { error: pisoErr } = await supabase
		.from('rds_pisos')
		.delete()
		.eq('id', id);

	  if (pisoErr) {
		return json({ error: pisoErr.message }, 500);
	  }

	  return json({ ok: true });
	}

	// ---------------- CREATE / UPDATE ----------------
	const nombre = emptyOrNull(body.nombre);
	const direccion = emptyOrNull(body.direccion);

	if (!nombre) {
	  return json({ error: 'nombre requerido' }, 400);
	}

	// UPDATE si hay id
	if (id) {
	  const { error } = await supabase
		.from('rds_pisos')
		.update({
		  nombre,
		  direccion,
		})
		.eq('id', id);

	  if (error) {
		return json({ error: error.message }, 500);
	  }

	  return json({ ok: true, id });
	}

	// CREATE si no hay id
	// Aseguramos fecha_creacion porque la columna es NOT NULL
	const fecha_creacion =
	  emptyOrNull(body.fecha_creacion) ??
	  new Date().toISOString(); // si tu columna es date, puedes usar .slice(0,10)

	const { data, error } = await supabase
	  .from('rds_pisos')
	  .insert(
		{
		  nombre,
		  direccion,
		  fecha_creacion,
		},
	  )
	  .select('id')
	  .single();

	if (error) {
	  return json({ error: error.message }, 500);
	}

	return json({
	  ok: true,
	  id: data.id,
	  redirect: '/admin/rds',
	});
  } catch (err: any) {
	console.error('rds_piso_save error', err);
	return json({ error: err?.message || 'Unexpected error' }, 500);
  }
};