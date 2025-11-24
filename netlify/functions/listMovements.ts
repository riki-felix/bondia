// netlify/functions/listMovements.ts
import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  ensureConfig,
  serviceSupabase,
} from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'GET') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();

	const qs = event.queryStringParameters || {};

	const limitRaw = qs.limit;
	const offsetRaw = qs.offset;
	const yearRaw = qs.year;
	const qRaw = qs.q;

	// Cambio importante: ahora se llama ambito, NO destino
	const ambitoRaw = qs.ambito;

	const limit = Number.isFinite(Number(limitRaw)) && Number(limitRaw) > 0
	  ? Math.min(Number(limitRaw), 200)
	  : 50;

	const offset = Number.isFinite(Number(offsetRaw)) && Number(offsetRaw) >= 0
	  ? Number(offsetRaw)
	  : 0;

	const year = yearRaw ? Number(yearRaw) : null;
	const q = qRaw && String(qRaw).trim() !== '' ? String(qRaw).trim() : null;
	const ambito =
	  ambitoRaw && String(ambitoRaw).trim() !== ''
		? String(ambitoRaw).trim()
		: null;

	let query = supabase
	  .from('movimientos')
	  .select(
		`
		id,
		slug,
		fecha,
		concepto,
		importe,
		tipo_movimiento,
		autor,
		propiedad_id,
		created_at,
		ambito,
		propiedades!movimientos_propiedad_id_fkey (
		  id,
		  titulo
		)
	  `,
		{ count: 'exact' }
	  );

	// Año
	if (year && Number.isFinite(year)) {
	  const from = `${year}-01-01`;
	  const to = `${year + 1}-01-01`;
	  query = query.gte('fecha', from).lt('fecha', to);
	}

	// Búsqueda
	if (q) query = query.ilike('concepto', `%${q}%`);

	// Ámbito (casa | inversion | otro)
	if (ambito && ['casa', 'inversion', 'otro'].includes(ambito)) {
	  query = query.eq('ambito', ambito);
	}

	// Orden por fecha
	query = query
	  .order('fecha', { ascending: false })
	  .order('created_at', { ascending: false })
	  .range(offset, offset + limit - 1);

	const { data, error, count } = await query;

	if (error) {
	  console.error('[listMovements] error:', error);
	  return json(
		{ error: 'Error fetching movements', detail: error.message },
		500
	  );
	}

	const safeData = (data || []).map((m: any) => ({
	  id: m.id,
	  slug: m.slug || m.id,
	  fecha: m.fecha,
	  concepto: m.concepto,
	  importe: m.importe,
	  tipo_movimiento: m.tipo_movimiento,
	  autor: m.autor,
	  ambito: m.ambito,
	  propiedad_id: m.propiedad_id,
	  propiedad_titulo:
		m.propiedades && Array.isArray(m.propiedades) && m.propiedades[0]
		  ? m.propiedades[0].titulo
		  : m.propiedades?.titulo ?? null,
	  created_at: m.created_at,
	}));

	return json({
	  data: safeData,
	  limit,
	  offset,
	  count: count ?? safeData.length,
	  hasMore: (count ?? safeData.length) > offset + safeData.length,
	});
  } catch (err: any) {
	console.error('[listMovements] unexpected error:', err);
	return json({ error: 'Unexpected error fetching movements' }, 500);
  }
};