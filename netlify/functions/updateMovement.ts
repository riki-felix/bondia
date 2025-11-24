// netlify/functions/updateMovement.ts
import type { Handler } from '@netlify/functions';
import {
  json, ok, parseBody, ensureConfig, serviceSupabase,
  emptyOrNull, toMoneyOrNull, toDateOrNull, slugifyEs, pickFrom
} from './_shared';

const ESTADO = new Set(['pendiente', 'pagado']);
const FREQ   = new Set(['puntual', 'semanal', 'mensual', 'bimensual', 'trimestral', 'anual']);
const MOV_TIPO_ENUM = new Set(['Gasto', 'Aportación']);
const AMBITO = new Set(['inversion', 'casa', 'otro']);

// Normaliza tipo_movimiento al ENUM
function normalizeTipoMovimiento(v: unknown): 'Gasto' | 'Aportación' {
  const raw = String(v ?? '').trim();
  if (MOV_TIPO_ENUM.has(raw as any)) return raw as 'Gasto' | 'Aportación';

  const low = raw.toLowerCase();
  if (low.startsWith('a')) return 'Aportación';
  if (low.startsWith('g')) return 'Gasto';
  return 'Gasto';
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	if (!id) return json({ error: 'id requerido' }, 400);

	// Cargamos el movimiento actual (por si necesitamos valores existentes)
	const { data: current, error: loadErr } = await supabase
	  .from('movimientos')
	  .select('*')
	  .eq('id', id)
	  .maybeSingle();

	if (loadErr) return json({ error: loadErr.message }, 500);
	if (!current) return json({ error: 'Movimiento no encontrado' }, 404);

	const updates: Record<string, any> = {};

	// Campos básicos (solo si vienen en body)
	if ('propiedad_id' in body) {
	  const propiedad_id = emptyOrNull(body.propiedad_id);
	  if (!propiedad_id) return json({ error: 'propiedad_id requerido' }, 400);
	  updates.propiedad_id = propiedad_id;
	}

	if ('concepto' in body) {
	  const concepto = emptyOrNull(body.concepto);
	  if (!concepto) return json({ error: 'concepto requerido' }, 400);
	  updates.concepto = concepto;

	  // Opcional: actualizar slug si cambia el concepto
	  // (solo si quieres este comportamiento)
	  const base = slugifyEs(concepto);
	  if (base && base !== current.slug) {
		const { data: existing } = await supabase
		  .from('movimientos')
		  .select('slug')
		  .ilike('slug', `${base}%`);
		const taken = new Set((existing || []).map((r: any) => r.slug));
		let slug = base;
		if (taken.has(slug)) {
		  let n = 2;
		  while (taken.has(`${base}-${n}`)) n++;
		  slug = `${base}-${n}`;
		}
		updates.slug = slug;
	  }
	}

	if ('fecha' in body) {
	  const fecha = toDateOrNull(body.fecha);
	  if (!fecha) return json({ error: 'fecha inválida (YYYY-MM-DD)' }, 400);
	  updates.fecha = fecha;
	}

	if ('importe' in body) {
	  const importe = toMoneyOrNull(body.importe);
	  if (importe == null) return json({ error: 'importe inválido' }, 400);
	  updates.importe = importe;
	}

	if ('estado' in body) {
	  const estado = pickFrom(body.estado, ESTADO) || 'pendiente';
	  updates.estado = estado;
	}

	if ('frecuencia' in body) {
	  const frecuencia = pickFrom(body.frecuencia, FREQ) || 'puntual';
	  updates.frecuencia = frecuencia;
	}

	if ('categoria_id' in body) {
	  const categoria_id = emptyOrNull(body.categoria_id);
	  updates.categoria_id = categoria_id || null;
	}

	// NUEVO: ámbito
	if ('ambito' in body) {
	  const ambitoRaw = emptyOrNull(body.ambito);
	  const ambitoPick = ambitoRaw ? pickFrom(ambitoRaw, AMBITO) : null;
	  updates.ambito = ambitoPick || null;
	}

	// NUEVO: tipo_movimiento
	if ('tipo_movimiento' in body || 'tipo' in body) {
	  const tipo_movimiento = normalizeTipoMovimiento(
		body.tipo_movimiento ?? body.tipo ?? current.tipo_movimiento ?? 'Gasto'
	  );
	  updates.tipo_movimiento = tipo_movimiento;
	}

	// Documento opcional
	if ('documento_path' in body) {
	  const documento_path = emptyOrNull(body.documento_path);
	  updates.documento_path = documento_path || null;
	}

	// Si no hay nada que actualizar:
	if (Object.keys(updates).length === 0) {
	  return json({ ok: true, message: 'Nada que actualizar' }, 200);
	}

	// Actualizamos el movimiento
	const { error: updErr } = await supabase
	  .from('movimientos')
	  .update(updates)
	  .eq('id', id);

	if (updErr) return json({ error: updErr.message }, 500);

	// TAGS (mapeo) — manejamos todos los casos sin usar `.split` sobre undefined
	let rawTags: any[] = [];

	if (Array.isArray(body.tags_ids)) {
	  rawTags = body.tags_ids;
	} else if (Array.isArray(body.tags)) {
	  rawTags = body.tags;
	} else if (typeof body.tags === 'string' && body.tags.trim() !== '') {
	  rawTags = body.tags
		.split(/[,\s]+/)
		.map((s: string) => s.trim())
		.filter(Boolean);
	}

	if (rawTags.length) {
	  const tagIds: string[] = [];

	  for (const t of rawTags) {
		const token = emptyOrNull(t);
		if (!token) continue;

		// UUID → directamente
		if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) {
		  tagIds.push(token);
		  continue;
		}

		const name = token;
		const slug = slugifyEs(name);
		const { data: found, error: fErr } = await supabase
		  .from('movimiento_tags')
		  .select('id')
		  .eq('slug', slug)
		  .maybeSingle();
		if (fErr) return json({ error: fErr.message }, 500);

		if (found?.id) {
		  tagIds.push(found.id);
		} else {
		  const { data: created, error: cErr } = await supabase
			.from('movimiento_tags')
			.insert({ nombre: name, slug })
			.select('id')
			.single();
		  if (cErr) return json({ error: cErr.message }, 500);
		  tagIds.push(created.id);
		}
	  }

	  if (tagIds.length) {
		// Limpia mapeos anteriores y vuelve a insertar
		await supabase
		  .from('movimiento_tag_map')
		  .delete()
		  .eq('movimiento_id', id);

		const rows = tagIds.map((tid) => ({ movimiento_id: id, tag_id: tid }));
		const { error: mErr } = await supabase.from('movimiento_tag_map').insert(rows);
		if (mErr) return json({ error: mErr.message }, 500);
	  }
	}

	return json({ ok: true }, 200);
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};