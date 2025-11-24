import type { Handler } from '@netlify/functions';
import {
  json, ok, parseBody, ensureConfig, serviceSupabase,
  emptyOrNull, toMoneyOrNull, toDateOrNull, pickFrom
} from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const concepto = (body.concepto || '').trim();
	if (!concepto) return json({ error: 'Concepto requerido' }, 400);

	const fecha = toDateOrNull(body.fecha);
	if (!fecha) return json({ error: 'Fecha requerida' }, 400);

	const importe = toMoneyOrNull(body.importe);
	if (importe == null) return json({ error: 'Importe requerido' }, 400);

	const modo_pago = body.modo_pago;
	if (!['transferencia', 'efectivo'].includes(modo_pago)) {
	  return json({ error: 'Modo de pago inválido' }, 400);
	}

	const autor = body.autor;
	if (!['Sanyus', 'Blaster'].includes(autor)) {
	  return json({ error: 'Autor inválido' }, 400);
	}

	const insert = {
	  concepto,
	  fecha,
	  importe,
	  propiedad_id: emptyOrNull(body.propiedad_id),
	  justificante_path: emptyOrNull(body.justificante_path),
	  modo_pago,
	  autor,
	};

	const { data, error } = await supabase
	  .from('aportaciones')
	  .insert(insert)
	  .select('id')
	  .single();

	if (error) {
	  console.error('[aportacion-create] Supabase error', error);
	  return json({ error: 'Error al crear aportación' }, 500);
	}

	return json({ ok: true, id: data.id });
  } catch (err: any) {
	console.error('[aportacion-create] Error', err);
	return json({ error: err.message || String(err) }, 500);
  }
};