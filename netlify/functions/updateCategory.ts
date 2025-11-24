// netlify/functions/upsertMovCategory.ts
import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  ensureConfig,
  serviceSupabase,
  emptyOrNull,
  slugifyEs,
} from './_shared';

const TABLES = {
  movimientos: 'movimiento_categorias',
  activos: 'casa_activo_categorias',
} as const;

type ScopeKey = keyof typeof TABLES;

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();

	const body = (() => {
	  try {
		return JSON.parse(event.body || '{}');
	  } catch {
		return {};
	  }
	})();

	const scopeRaw = (body.scope || body.ambito || body.tipo || 'movimientos') as ScopeKey;
	const table =
	  TABLES[scopeRaw] ??
	  TABLES.movimientos; // 🔒 fallback a movimientos

	const id     = emptyOrNull(body.id);
	const nombre = emptyOrNull(body.nombre);

	if (!nombre) return json({ error: 'nombre requerido' }, 400);

	const slug = slugifyEs(nombre);

	if (id) {
	  // UPDATE
	  const { error } = await supabase
		.from(table)
		.update({ nombre, slug })
		.eq('id', id);

	  if (error) {
		console.error('[upsertMovCategory] update error:', error);
		return json({ error: error.message }, 500);
	  }

	  return json({ id, nombre, slug, scope: scopeRaw }, 200);
	} else {
	  // INSERT
	  const { data, error } = await supabase
		.from(table)
		.insert({ nombre, slug })
		.select('id')
		.single();

	  if (error) {
		console.error('[upsertMovCategory] insert error:', error);
		return json({ error: error.message }, 500);
	  }

	  return json({ id: data?.id, nombre, slug, scope: scopeRaw }, 201);
	}
  } catch (e: any) {
	console.error('[upsertMovCategory] unexpected error:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};