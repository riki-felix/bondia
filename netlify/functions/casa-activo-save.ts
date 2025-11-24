import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  parseBody,
  ensureConfig,
  serviceSupabase,
  emptyOrNull,
  toMoneyOrNull,
  toDateOrNull,
  slugifyEs,
} from './_shared';

export const handler: Handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	const nombre = emptyOrNull(body.nombre);
	const descripcion = emptyOrNull(body.descripcion);
	const categoria_id = emptyOrNull(body.categoria_id);
	const propiedad_id = emptyOrNull(body.propiedad_id);

	if (!nombre) {
	  return json({ error: 'El nombre del activo es obligatorio' }, 400);
	}

	// Parseo de valor estimado (string tipo "10.000,50" → número)
	const valor_estimado = toMoneyOrNull(body.valor_estimado);

	// Fecha de compra (string "YYYY-MM-DD" o vacío)
	const fecha_compra = toDateOrNull(body.fecha_compra);

	const slug = slugifyEs(nombre);

	const payload: Record<string, any> = {
	  nombre,
	  slug,
	  descripcion,
	  categoria_id: categoria_id || null,
	  propiedad_id: propiedad_id || null,
	  valor_estimado,
	  fecha_compra,
	};

	if (id) {
	  // UPDATE
	  const { data, error } = await supabase
		.from('casa_activos')
		.update(payload)
		.eq('id', id)
		.select()
		.single();

	  if (error) {
		console.error('Error actualizando activo de casa:', error);
		return json({ error: 'No se pudo actualizar el activo', detail: error.message }, 500);
	  }

	  return json({ ok: true, mode: 'edit', activo: data });
	} else {
	  // INSERT
	  const { data, error } = await supabase
		.from('casa_activos')
		.insert(payload)
		.select()
		.single();

	  if (error) {
		console.error('Error creando activo de casa:', error);
		return json({ error: 'No se pudo crear el activo', detail: error.message }, 500);
	  }

	  return json({ ok: true, mode: 'create', activo: data });
	}
  } catch (err: any) {
	console.error('Error inesperado en casa-activo-save:', err);
	return json({ error: 'Error interno al guardar el activo' }, 500);
  }
};