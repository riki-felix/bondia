import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PERIOD = new Set(['mensual','trimestral','anual']);
const ESTADO = new Set(['tanteo','negociacion','compra','reforma','alquiler','vendido']);
const LUZ  = new Set(['sin_suministro','pinchada','contratada']);
const AGUA = new Set(['sin_suministro','pinchada','contratada']);
const GAS  = new Set(['sin_suministro','pinchado','contratado']);
const TIPO = new Set(['inversion','activo']);

function json(payload: any, statusCode = 200) {
  return {
	statusCode,
	headers: {
	  'Access-Control-Allow-Origin': '*',
	  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	  'Access-Control-Allow-Methods': 'POST, OPTIONS',
	  'Content-Type': 'application/json; charset=utf-8',
	},
	body: JSON.stringify(payload),
  };
}
function parseBody(body?: string | null) { if (!body) return {}; try { return JSON.parse(body); } catch { return {}; } }
function emptyOrNull(v: any) { if (v == null) return null; const s = String(v).trim(); return s === '' ? null : s; }
function toIntOrNull(v: any) { const s = String(v ?? '').trim(); if (!s) return null; const n = Number(s); return Number.isInteger(n) ? n : null; }
function toYearOrNull(v: any) { const n = toIntOrNull(v); if (n == null) return null; if (n < 1000 || n > 2100) return null; return n; }
function normalizeMoneyLike(v: any): string | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  s = s.replace(/\s+/g, '');
  const hasComma = s.includes(',');
  if (hasComma) {
	s = s.replace(/\./g, '');
	const last = s.lastIndexOf(',');
	const intPart = s.slice(0, last).replace(/,/g, '');
	const decPart = s.slice(last + 1);
	s = intPart + (decPart ? ('.' + decPart) : '');
  } else {
	const last = s.lastIndexOf('.');
	if (last >= 0) {
	  const intPart = s.slice(0, last).replace(/\./g, '');
	  const decPart = s.slice(last + 1);
	  s = intPart + (decPart ? ('.' + decPart) : '');
	}
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return s;
}
function toMoneyOrNull(v: any): number | null {
  const canon = normalizeMoneyLike(v);
  if (canon == null) return null;
  const n = Number(canon);
  if (!Number.isFinite(n)) return null;
  if (Math.trunc(Math.abs(n)) >= 1_000_000_000) return null;
  return Number(n.toFixed(2));
}
function pickFrom(v: any, allowed: Set<string>): string | null {
  if (typeof v !== 'string') return null;
  const x = v.trim().toLowerCase();
  return allowed.has(x) ? x : null;
}
function slugifyEs(s: string): string {
  return s
	.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9\s-]/g, '')
	.trim()
	.replace(/\s+/g, '-')
	.replace(/-+/g, '-');
}
async function findNextUniqueSlug(supabase: any, base: string): Promise<string> {
  const { data, error } = await supabase
	.from('propiedades')
	.select('slug')
	.ilike('slug', `${base}%`);
  if (error) return base;
  const taken = new Set<string>((data || []).map((r: any) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2; while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' };
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('Config: SUPABASE_URL ausente o inválida');
	if (!SUPABASE_SERVICE_ROLE) throw new Error('Config: SUPABASE_SERVICE_ROLE ausente');

	const body = parseBody(event.body);
	const id = emptyOrNull(body.id);
	if (!id) return json({ error: 'ID requerido' }, 400);

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });

	// Cargar actual para comparar slug/título
	const { data: current, error: getErr } = await supabase.from('propiedades').select('id, slug, titulo').eq('id', id).single();
	if (getErr || !current) return json({ error: 'Propiedad no encontrada' }, 404);

	const updates: Record<string, any> = {};
	// Campos editables (igual que create)
	if (body.tipo !== undefined) {
	  const t = (typeof body.tipo === 'string') ? body.tipo.trim().toLowerCase() : null;
	  if (t && !TIPO.has(t)) {
		return json({ error: 'tipo inválido (inversion|activo)' }, 400);
	  }
	  if (t) updates.tipo = t; // permite ponerlo a null si quisieras; si no, usa "if (t) updates.tipo = t;"
	}
	if (body.titulo != null) updates.titulo = String(body.titulo).trim();
	if (body.direccion != null) updates.direccion = String(body.direccion).trim();
	if (body.superficie_m2 != null) updates.superficie_m2 = toIntOrNull(body.superficie_m2);
	if (body.anio_construccion != null) updates.anio_construccion = toYearOrNull(body.anio_construccion);
	if (body.numero_catastro != null) updates.numero_catastro = emptyOrNull(body.numero_catastro);
	if (body.fecha_compra != null) updates.fecha_compra = emptyOrNull(body.fecha_compra);

	if (body.precio_compra != null) updates.precio_compra = toMoneyOrNull(body.precio_compra);
	if (body.precio_venta != null) updates.precio_venta = toMoneyOrNull(body.precio_venta);
	if (body.alquiler_previsto != null) updates.alquiler_previsto = toMoneyOrNull(body.alquiler_previsto);
	if (body.valor_catastro != null) updates.valor_catastro = toMoneyOrNull(body.valor_catastro);
	if (body.valor_ite != null) updates.valor_ite = toMoneyOrNull(body.valor_ite);
	if (body.coste_administrador != null) updates.coste_administrador = toMoneyOrNull(body.coste_administrador);
	if (body.cuota_comunidad != null) updates.cuota_comunidad = toMoneyOrNull(body.cuota_comunidad);
	if (body.periodicidad_cuota != null) updates.periodicidad_cuota = pickFrom(body.periodicidad_cuota, PERIOD);
	if (body.ibi != null) updates.ibi = toMoneyOrNull(body.ibi);

	if (body.estado != null) updates.estado = pickFrom(body.estado, ESTADO);
	if (body.suministro_luz != null) updates.suministro_luz = pickFrom(body.suministro_luz, LUZ);
	if (body.suministro_agua != null) updates.suministro_agua = pickFrom(body.suministro_agua, AGUA);
	if (body.suministro_gas != null) updates.suministro_gas = pickFrom(body.suministro_gas, GAS);

	// Paths (si decides pasarlos desde el front tras upload)
	if (body.foto_destacada_path != null) updates.foto_destacada_path = emptyOrNull(body.foto_destacada_path);
	if (body.plano_path != null) updates.plano_path = emptyOrNull(body.plano_path);

	// Slug si cambió el título
	if (updates.titulo && updates.titulo !== current.titulo) {
	  const base = slugifyEs(updates.titulo) || 'propiedad';
	  updates.slug = await findNextUniqueSlug(supabase, base);
	}

	const { data, error } = await supabase.from('propiedades').update(updates).eq('id', id).select('id, slug').single();
	if (error) return json({ error: error.message, code: (error as any).code }, 500);

	return json({ id: data.id, slug: data.slug }, 200);
  } catch (e: any) {
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};