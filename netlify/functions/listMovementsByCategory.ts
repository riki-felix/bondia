import type { Handler } from '@netlify/functions';
import { json, ok, ensureConfig, serviceSupabase } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'GET') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const qs = event.queryStringParameters || {};
	const yearRaw = qs.year;

	let query = supabase
	  .from('movimientos_categorias_resumen')
	  .select('categoria_id, categoria_nombre, anio, num_movimientos, total_importe');

	if (yearRaw && yearRaw !== 'all') {
	  const year = Number(yearRaw);
	  if (Number.isFinite(year)) {
		query = query.eq('anio', year);
	  }
	}

	const { data, error } = await query.order('total_importe', { ascending: false });

	if (error) {
	  console.error('[listMovementsByCategory] error:', error);
	  return json({ error: 'Error fetching category summary' }, 500);
	}

	return json({ data: data ?? [] });
  } catch (err: any) {
	console.error('[listMovementsByCategory] unexpected error:', err);
	return json({ error: 'Unexpected error fetching category summary' }, 500);
  }
};