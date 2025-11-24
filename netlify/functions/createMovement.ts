// netlify/functions/createMovement.ts
import type { Handler } from '@netlify/functions';
import {
  json, ok, parseBody, ensureConfig, serviceSupabase,
  emptyOrNull, toMoneyOrNull, toDateOrNull, slugifyEs,
  DEFAULT_CATEGORY_ID, pickFrom
} from './_shared';

const ESTADO = new Set(['pendiente','pagado']);
const FREQ   = new Set(['puntual','semanal','mensual','bimensual','trimestral','anual']);

// Valores EXACTOS del ENUM en la DB
const MOV_TIPO_ENUM = new Set(['Gasto', 'Aportación']);

// Ámbitos permitidos en la columna ambito
const AMBITO = new Set(['inversion', 'casa', 'otro']);

// Normaliza cualquier entrada a uno de los dos valores del ENUM
function normalizeTipoMovimiento(v: unknown): 'Gasto' | 'Aportación' {
  const raw = String(v ?? '').trim();

  // si ya está correcto (exactamente enum), devuélvelo
  if (MOV_TIPO_ENUM.has(raw as any)) return raw as 'Gasto' | 'Aportación';

  // tolera variantes en minúsculas y sin tilde
  const low = raw.toLowerCase();
  if (low.startsWith('a')) return 'Aportación'; // "aportacion", "aportación", etc.
  if (low.startsWith('g')) return 'Gasto';
  return 'Gasto'; // por defecto
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	// Requeridos
	const propiedad_id = emptyOrNull(body.propiedad_id);
	const concepto     = emptyOrNull(body.concepto);
	const fecha        = toDateOrNull(body.fecha);
	const importe      = toMoneyOrNull(body.importe);
	if (!propiedad_id)   return json({ error: 'propiedad_id requerido' }, 400);
	if (!concepto)       return json({ error: 'concepto requerido' }, 400);
	if (!fecha)          return json({ error: 'fecha inválida (YYYY-MM-DD)' }, 400);
	if (importe == null) return json({ error: 'importe inválido' }, 400);

	const estado     = pickFrom(body.estado, ESTADO) || 'pendiente';
	const frecuencia = pickFrom(body.frecuencia, FREQ) || 'puntual';

	// Categoría (id directo o fallback a DEFAULT)
	let categoria_id = emptyOrNull(body.categoria_id) || DEFAULT_CATEGORY_ID;

	// Documento opcional (path ya subido)
	const documento_path = emptyOrNull(body.documento_path);

	// NUEVO: tipo_movimiento (ENUM)
	const tipo_movimiento = normalizeTipoMovimiento(
	  body.tipo_movimiento ?? body.tipo ?? 'Gasto'
	);

	// NUEVO: ámbito (inversion | casa | otro) con fallback a 'inversion'
	const ambitoRaw = emptyOrNull(body.ambito);
	const ambito =
	  ambitoRaw && AMBITO.has(ambitoRaw)
		? ambitoRaw
		: 'inversion';

	// Generar slug único a partir del concepto
	const base = slugifyEs(concepto || 'movimiento');

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

	// Insert
	const { data, error } = await supabase
	  .from('movimientos')
	  .insert({
		slug,
		propiedad_id,
		concepto,
		fecha,
		importe,
		estado,
		frecuencia,
		categoria_id,
		tipo_movimiento,
		ambito,          // 👈 IMPORTANTE: grabamos el ámbito
		documento_path,
	  })
	  .select('id')
	  .single();

	if (error) return json({ error: error.message }, 500);
	const movement_id = data!.id;

	// Tags (ids o nombres)
	let rawTags: any[] = [];
	if (Array.isArray(body.tags_ids)) rawTags = body.tags_ids;
	else if (Array.isArray(body.tags)) rawTags = body.tags;
	else if (typeof body.tags === 'string') {
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

		// UUID?
		if (
		  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			token
		  )
		) {
		  tagIds.push(token);
		  continue;
		}

		// Nombre → movimiento_tags
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
		const rows = tagIds.map((tid) => ({
		  movimiento_id: movement_id,
		  tag_id: tid,
		}));
		const { error: mErr } = await supabase
		  .from('movimiento_tag_map')
		  .insert(rows);
		if (mErr) return json({ error: mErr.message }, 500);
	  }
	}

	return json({ id: movement_id }, 201);
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};