// netlify/functions/deleteMovCategory.ts
import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  ensureConfig,
  serviceSupabase,
  emptyOrNull,
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
	  TABLES.movimientos;

	const id = emptyOrNull(body.id);
	if (!id) return json({ error: 'id requerido' }, 400);

	const { error } = await supabase
	  .from(table)
	  .delete()
	  .eq('id', id);

	if (error) {
	  console.error('[deleteMovCategory] delete error:', error);
	  return json({ error: error.message }, 500);
	}

	return json({ ok: true, id, scope: scopeRaw }, 200);
  } catch (e: any) {
	console.error('[deleteMovCategory] unexpected error:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};