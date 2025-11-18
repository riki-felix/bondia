// netlify/functions/updateMovement.ts
import type { Handler } from '@netlify/functions';
import {
  json, ok, parseBody, ensureConfig, serviceSupabase,
  emptyOrNull, toMoneyOrNull, toDateOrNull, slugifyEs, pickFrom
} from './_shared';

const ESTADO = new Set(['pendiente','pagado']);
const FREQ   = new Set(['puntual','semanal','mensual','bimensual','trimestral','anual']);

// === ENUM movimiento_tipo en DB ===
// Valores EXACTOS (ojo con la tilde y mayúsculas)
const MOV_TIPO_ENUM = new Set<'Gasto' | 'Aportación'>(['Gasto', 'Aportación']);

// Normaliza cualquier entrada a uno de los dos valores del ENUM
function normalizeTipoMovimiento(v: unknown): 'Gasto' | 'Aportación' {
  const raw = String(v ?? '').trim();
  // si ya coincide exactamente, úsalo
  if (MOV_TIPO_ENUM.has(raw as any)) return raw as 'Gasto' | 'Aportación';
  // tolera minúsculas y sin tilde
  const low = raw.toLowerCase();
  if (low.startsWith('a')) return 'Aportación'; // "aportacion" / "aportación" / "aport"
  if (low.startsWith('g')) return 'Gasto';      // "gasto"
  return 'Gasto'; // por defecto
}

async function findNextUniqueSlug(supabase: any, base: string): Promise<string> {
  const { data, error } = await supabase
	.from('movimientos')
	.select('slug')
	.ilike('slug', `${base}%`);
  if (error) return base;

  const taken = new Set<string>((data || []).map((r: any) => r.slug));
  if (!taken.has(base)) return base;

  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
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

	// Cargar movimiento actual (para comparar concepto → slug)
	const { data: current, error: curErr } = await supabase
	  .from('movimientos')
	  .select('id, concepto, slug')
	  .eq('id', id)
	  .maybeSingle();
	if (curErr) return json({ error: curErr.message }, 500);
	if (!current) return json({ error: 'Movimiento no encontrado' }, 404);

	const updates: Record<string, any> = {};

	// Campos base
	if (body.propiedad_id !== undefined) updates.propiedad_id = emptyOrNull(body.propiedad_id);
	if (body.concepto      !== undefined) updates.concepto      = emptyOrNull(body.concepto);
	if (body.fecha         !== undefined) updates.fecha         = toDateOrNull(body.fecha);

	if (body.importe !== undefined) {
	  const v = toMoneyOrNull(body.importe);
	  if (v == null) return json({ error: 'importe inválido' }, 400);
	  updates.importe = v;
	}

	if (body.estado     !== undefined) updates.estado     = pickFrom(body.estado, ESTADO) || 'pendiente';
	if (body.frecuencia !== undefined) updates.frecuencia = pickFrom(body.frecuencia, FREQ) || 'puntual';

	// === NUEVO: tipo_movimiento (ENUM) ===
	// Acepta body.tipo_movimiento o body.tipo; solo actualiza si viene en el body
	if (Object.prototype.hasOwnProperty.call(body, 'tipo_movimiento') ||
		Object.prototype.hasOwnProperty.call(body, 'tipo')) {
	  const tipo_movimiento = normalizeTipoMovimiento(body.tipo_movimiento ?? body.tipo);
	  // Validación explícita (por claridad, aunque normalize ya limita)
	  if (!MOV_TIPO_ENUM.has(tipo_movimiento)) {
		return json({ error: 'tipo_movimiento inválido' }, 400);
	  }
	  updates.tipo_movimiento = tipo_movimiento;
	}

	// categoría: id o nombre (si llega cualquiera de los dos)
	if (body.categoria_id !== undefined || body.categoria_nombre !== undefined) {
	  let categoria_id = emptyOrNull(body.categoria_id);
	  const categoria_nombre = emptyOrNull(body.categoria_nombre);

	  if (!categoria_id && categoria_nombre) {
		const slug = slugifyEs(categoria_nombre);
		const { data: found, error: fErr } = await supabase
		  .from('movimiento_categorias')
		  .select('id')
		  .eq('slug', slug)
		  .maybeSingle();
		if (fErr) return json({ error: fErr.message }, 500);

		if (found?.id) {
		  categoria_id = found.id;
		} else {
		  const { data: created, error: cErr } = await supabase
			.from('movimiento_categorias')
			.insert({ nombre: categoria_nombre, slug })
			.select('id')
			.single();
		  if (cErr) return json({ error: cErr.message }, 500);
		  categoria_id = created.id;
		}
	  }

	  updates.categoria_id = categoria_id || null; // permite limpiar si viene vacío
	}

	if (body.documento_path !== undefined) updates.documento_path = emptyOrNull(body.documento_path);

	// Slug: si cambia el concepto, recalcular slug único
	if (updates.concepto && updates.concepto !== current.concepto) {
	  const base = slugifyEs(updates.concepto) || 'movimiento';
	  updates.slug = await findNextUniqueSlug(supabase, base);
	}

	// UPDATE
	const { error: updErr } = await supabase
	  .from('movimientos')
	  .update(updates)
	  .eq('id', id);
	if (updErr) return json({ error: updErr.message }, 500);

	// ===== TAGS: admite `tags_ids` (array de UUID) o `tags` (array/CSV de nombres/UUIDs) =====
	const hasTagsIds = Object.prototype.hasOwnProperty.call(body, 'tags_ids');
	const hasTags    = Object.prototype.hasOwnProperty.call(body, 'tags');

	if (hasTagsIds || hasTags) {
	  let tokens: string[] = [];

	  if (hasTagsIds && Array.isArray(body.tags_ids)) {
		tokens = body.tags.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
	  } else if (hasTags) {
		if (Array.isArray(body.tags)) {
		  tokens = body.tags.map((x: any) => String(x)).filter(Boolean);
		} else if (typeof body.tags === 'string') {
		  tokens = body.tags.split(/[,\s]+/).map((s: string) => s.trim()).filter(Boolean);
		}
	  }

	  // 1) Borra todos los tags actuales
	  const { error: delErr } = await supabase
		.from('movimiento_tag_map')
		.delete()
		.eq('movimiento_id', id);
	  if (delErr) return json({ error: delErr.message }, 500);

	  // 2) Inserta si hay nuevos
	  if (tokens.length > 0) {
		const tagIds: string[] = [];

		for (const token of tokens) {
		  const val = emptyOrNull(token);
		  if (!val) continue;

		  // UUID v4
		  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val)) {
			tagIds.push(val);
			continue;
		  }

		  // Nombre → buscar/crear
		  const slug = slugifyEs(val);
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
			  .insert({ nombre: val, slug })
			  .select('id')
			  .single();
			if (cErr) return json({ error: cErr.message }, 500);
			tagIds.push(created.id);
		  }
		}

		if (tagIds.length) {
		  const rows = tagIds.map((tid) => ({ movimiento_id: id, tag_id: tid }));
		  const { error: insErr } = await supabase
			.from('movimiento_tag_map')
			.insert(rows);
		  if (insErr) return json({ error: insErr.message }, 500);
		}
	  }
	}

	return json({ id }, 200);
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};