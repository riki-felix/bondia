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
	if (!id) {
	  return json({ error: 'ID de activo requerido para eliminar' }, 400);
	}

	const { error } = await supabase
	  .from('casa_activos')
	  .delete()
	  .eq('id', id);

	if (error) {
	  console.error('Error eliminando activo de casa:', error);
	  return json({ error: 'No se pudo eliminar el activo', detail: error.message }, 500);
	}

	// Si usas el formulario clásico (no fetch), puedes redirigir con 303 Location,
	// pero con esta utilidad respondemos JSON y dejas que el front decida.
	return json({ ok: true, deletedId: id });
  } catch (err: any) {
	console.error('Error inesperado en casa-activo-delete:', err);
	return json({ error: 'Error interno al eliminar el activo' }, 500);
  }
};