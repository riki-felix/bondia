import type { Handler } from '@netlify/functions';
import {
  json, ok, parseBody, ensureConfig, serviceSupabase,
  emptyOrNull, toMoneyOrNull, toDateOrNull
} from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	if (!id) return json({ error: 'id requerido' }, 400);

	const updates: Record<string, any> = {};

	if (body.concepto != null) {
	  const c = String(body.concepto).trim();
	  if (!c) return json({ error: 'Concepto requerido' }, 400);
	  updates.concepto = c;
	}

	if (body.fecha != null) {
	  const f = toDateOrNull(body.fecha);
	  if (!f) return json({ error: 'Fecha inválida' }, 400);
	  updates.fecha = f;
	}

	if (body.importe != null) {
	  const imp = toMoneyOrNull(body.importe);
	  if (imp == null) return json({ error: 'Importe inválido' }, 400);
	  updates.importe = imp;
	}

	if (body.propiedad_id !== undefined) {
	  updates.propiedad_id = emptyOrNull(body.propiedad_id);
	}

	if (body.justificante_path !== undefined) {
	  updates.justificante_path = emptyOrNull(body.justificante_path);
	}

	if (body.modo_pago != null) {
	  if (!['transferencia', 'efectivo'].includes(body.modo_pago)) {
		return json({ error: 'Modo de pago inválido' }, 400);
	  }
	  updates.modo_pago = body.modo_pago;
	}

	if (body.autor != null) {
	  if (!['Sanyus', 'Blaster'].includes(body.autor)) {
		return json({ error: 'Autor inválido' }, 400);
	  }
	  updates.autor = body.autor;
	}

	const { error } = await supabase
	  .from('aportaciones')
	  .update(updates)
	  .eq('id', id);

	if (error) {
	  console.error('[aportacion-update] Supabase error', error);
	  return json({ error: 'Error al actualizar aportación' }, 500);
	}

	return json({ ok: true });
  } catch (err: any) {
	console.error('[aportacion-update] Error', err);
	return json({ error: err.message || String(err) }, 500);
  }
};