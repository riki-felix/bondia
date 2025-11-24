// netlify/functions/listMovCategories.ts
import type { Handler } from '@netlify/functions';
import { json, ok, ensureConfig, serviceSupabase } from './_shared';

const TABLES = {
  movimientos: 'movimiento_categorias',
  activos: 'casa_activo_categorias',
} as const;

type ScopeKey = keyof typeof TABLES;

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'GET') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();

	const qs = event.queryStringParameters || {};
	const scopeRaw = (qs.scope || qs.ambito || qs.tipo || 'movimientos') as ScopeKey;

	const table =
	  TABLES[scopeRaw] ??
	  TABLES.movimientos; // 🔒 fallback seguro: comportamiento antiguo

	const { data, error } = await supabase
	  .from(table)
	  .select('id, nombre, slug, created_at')
	  .order('nombre', { ascending: true });

	if (error) {
	  console.error('[listMovCategories] error:', error);
	  return json({ error: 'Error fetching categories', detail: error.message }, 500);
	}

	return json(data ?? [], 200);
  } catch (e: any) {
	console.error('[listMovCategories] unexpected error:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};