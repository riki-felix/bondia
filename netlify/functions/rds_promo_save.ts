import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  parseBody,
  ensureConfig,
  serviceSupabase,
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

	const anio = Number(body.anio);
	const meses = Array.isArray(body.meses) ? body.meses : [];

	if (!anio || !Number.isFinite(anio)) {
	  return json({ error: 'anio inválido' }, 400);
	}

	const rows = meses
	  .map((m: any) => {
		const mes = Number(m.mes);
		if (!mes || mes < 1 || mes > 12) return null;

		const importe = Number(m.importe || 0);

		return {
		  anio,
		  mes,
		  importe,
		};
	  })
	  .filter(Boolean);

	if (!rows.length) {
	  return json({ ok: true, updated: 0 });
	}

	const { error } = await supabase
	  .from('rds_promo')
	  .upsert(rows, { onConflict: 'anio,mes' });

	if (error) return json({ error: error.message }, 500);

	return json({ ok: true, updated: rows.length });
  } catch (err: any) {
	console.error('rds_promo_save error', err);
	return json({ error: err?.message || 'Unexpected error' }, 500);
  }
};