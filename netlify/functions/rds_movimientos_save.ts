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

	const piso_id = emptyOrNull(body.piso_id);
	const anio = Number(body.anio);
	const meses = Array.isArray(body.meses) ? body.meses : [];

	if (!piso_id) return json({ error: 'piso_id requerido' }, 400);
	if (!anio || !Number.isFinite(anio)) {
	  return json({ error: 'anio inválido' }, 400);
	}

	const rows = meses
	  .map((m: any) => {
		const mes = Number(m.mes);
		if (!mes || mes < 1 || mes > 12) return null;

		const gasto = Number(m.gasto || 0);
		const ingreso = Number(m.ingreso || 0);
		const promocion = Number(m.promocion || 0);

		return {
		  piso_id,
		  anio,
		  mes,
		  gasto,
		  ingreso,
		  promocion,
		};
	  })
	  .filter(Boolean);

	if (!rows.length) {
	  return json({ ok: true, updated: 0 });
	}

	// upsert por (piso_id, anio, mes)
	const { error } = await supabase
	  .from('rds_movimientos')
	  .upsert(rows, { onConflict: 'piso_id,anio,mes' });

	if (error) return json({ error: error.message }, 500);

	return json({ ok: true, updated: rows.length });
  } catch (err: any) {
	console.error('rds_movimientos_save error', err);
	return json({ error: err?.message || 'Unexpected error' }, 500);
  }
};