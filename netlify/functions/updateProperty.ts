// netlify/functions/updateProperty.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PERIOD = new Set(['mensual', 'bimensual', 'trimestral', 'anual']);
const ESTADO = new Set(['tanteo', 'negociacion', 'comprado', 'reforma', 'alquiler', 'vendido']);
const LUZ = new Set(['sin_suministro', 'pinchado', 'pinchada', 'contratado', 'contratada']);
const AGUA = new Set(['sin_suministro', 'pinchado', 'pinchada', 'contratado', 'contratada']);
const GAS = new Set(['sin_suministro', 'pinchado', 'pinchada', 'contratado', 'contratada']);
const TIPO = new Set(['inversion', 'activo']);

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

function parseBody(body?: string | null) {
  if (!body) return {};
  try {
	return JSON.parse(body);
  } catch {
	return {};
  }
}

function emptyOrNull(v: any) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function toIntOrNull(v: any): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function toYearOrNull(v: any): number | null {
  const n = toIntOrNull(v);
  if (n == null) return null;
  if (n < 1000 || n > 2100) return null;
  return n;
}

// "12.345,67" / "12345,67" / "12,34" -> "12345.67"
function normalizeMoneyLike(v: any): string | null {
  if (v == null) return null;
  let s = String(v).trim();
  if (!s) return null;
  s = s.replace(/\s+/g, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
	s = s.replace(/\./g, '');
	const last = s.lastIndexOf(',');
	const intPart = s.slice(0, last).replace(/,/g, '');
	const decPart = s.slice(last + 1);
	s = intPart + (decPart ? '.' + decPart : '');
  } else if (hasComma) {
	s = s.replace(/\./g, '');
	const last = s.lastIndexOf(',');
	const intPart = s.slice(0, last).replace(/,/g, '');
	const decPart = s.slice(last + 1);
	s = intPart + (decPart ? '.' + decPart : '');
  } else {
	const last = s.lastIndexOf('.');
	if (last >= 0) {
	  const intPart = s.slice(0, last).replace(/\./g, '');
	  const decPart = s.slice(last + 1);
	  s = intPart + (decPart ? '.' + decPart : '');
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
  return Number(n.toFixed(2));
}

function toDateISO(v: any): string | null {
  const s = emptyOrNull(v);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

function pickFrom(v: any, allowed: Set<string>): string | null {
  if (typeof v !== 'string') return null;
  const x = v.trim().toLowerCase();
  return allowed.has(x) ? x : null;
}

function toBoolOrNull(v: any): boolean | null {
  if (v == null) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1 ? true : v === 0 ? false : null;
  if (typeof v === 'string') {
	const s = v.trim().toLowerCase();
	if (['true', '1', 'yes', 'y', 'on'].includes(s)) return true;
	if (['false', '0', 'no', 'n', 'off'].includes(s)) return false;
  }
  return null;
}

// ✅ normaliza estados del UI a los estados válidos del CHECK/ENUM en DB
function normalizeEstado(v: any): string | null {
  if (v == null) return null;
  if (typeof v !== 'string') return null;
  let s = v.trim().toLowerCase();
  if (!s) return null;

  // sinónimos UI -> DB
  if (s === 'reformando') s = 'reforma';
  if (s === 'alquilado') s = 'alquiler';

  return s;
}

function slugifyEs(s: string): string {
  return s
	.normalize('NFD')
	.replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9\s-]/g, '')
	.trim()
	.replace(/\s+/g, '-')
	.replace(/-+/g, '-');
}

async function findNextUniqueSlug(supabase: any, base: string): Promise<string> {
  const { data } = await supabase.from('propiedades').select('slug').ilike('slug', `${base}%`);
  const taken = new Set<string>((data || []).map((r: any) => r.slug));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
	return {
	  statusCode: 204,
	  headers: {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	  },
	  body: '',
	};
  }

  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
	if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
	  throw new Error('Supabase config missing');
	}

	const body = parseBody(event.body);
	const id = emptyOrNull(body.id);
	if (!id) return json({ error: 'ID requerido' }, 400);

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
	  auth: { persistSession: false, autoRefreshToken: false },
	});

	const { data: current, error: getErr } = await supabase
	  .from('propiedades')
	  .select('id, slug, titulo')
	  .eq('id', id)
	  .single();

	if (getErr || !current) return json({ error: 'Propiedad no encontrada' }, 404);

	const updates: Record<string, any> = {};

	// tipo
	if (body.tipo !== undefined) {
	  const t = pickFrom(body.tipo, TIPO);
	  if (!t) return json({ error: 'tipo inválido (inversion|activo)' }, 400);
	  updates.tipo = t;
	}

	// básicos
	if (body.titulo !== undefined) updates.titulo = emptyOrNull(body.titulo);
	if (body.direccion !== undefined) updates.direccion = emptyOrNull(body.direccion);
	if (body.superficie_m2 !== undefined) updates.superficie_m2 = toIntOrNull(body.superficie_m2);
	if (body.anio_construccion !== undefined) updates.anio_construccion = toYearOrNull(body.anio_construccion);
	if (body.numero_catastro !== undefined) updates.numero_catastro = emptyOrNull(body.numero_catastro);
	if (body.fecha_compra !== undefined) updates.fecha_compra = toDateISO(body.fecha_compra);

	// dinero
	if (body.precio_compra !== undefined) updates.precio_compra = toMoneyOrNull(body.precio_compra);
	if (body.precio_venta !== undefined) updates.precio_venta = toMoneyOrNull(body.precio_venta);
	if (body.alquiler_previsto !== undefined) updates.alquiler_previsto = toMoneyOrNull(body.alquiler_previsto);

	if (body.valor_catastro !== undefined) updates.valor_catastro = toMoneyOrNull(body.valor_catastro);
	if (body.valor_ite !== undefined) updates.valor_ite = toMoneyOrNull(body.valor_ite);
	if (body.coste_administrador !== undefined) updates.coste_administrador = toMoneyOrNull(body.coste_administrador);
	if (body.cuota_comunidad !== undefined) updates.cuota_comunidad = toMoneyOrNull(body.cuota_comunidad);
	if (body.periodicidad_cuota !== undefined) {
	  const p = pickFrom(body.periodicidad_cuota, PERIOD);
	  if (body.periodicidad_cuota != null && body.periodicidad_cuota !== '' && !p) {
		return json({ error: 'periodicidad_cuota inválida' }, 400);
	  }
	  updates.periodicidad_cuota = p;
	}
	if (body.ibi !== undefined) updates.ibi = toMoneyOrNull(body.ibi);

	// ✅ estado (normalizado)
	if (body.estado !== undefined) {
	  const norm = normalizeEstado(body.estado); // reformando->reforma, alquilado->alquiler
	  if (norm == null) {
		updates.estado = null; // si llega vacío lo vacía
	  } else {
		const e = pickFrom(norm, ESTADO);
		if (!e) return json({ error: `estado inválido (${norm})` }, 400);
		updates.estado = e;
	  }
	}

	// suministros
	if (body.suministro_luz !== undefined) {
	  const v = pickFrom(body.suministro_luz, LUZ);
	  if (body.suministro_luz != null && body.suministro_luz !== '' && !v) return json({ error: 'suministro_luz inválido' }, 400);
	  updates.suministro_luz = v;
	}
	if (body.suministro_agua !== undefined) {
	  const v = pickFrom(body.suministro_agua, AGUA);
	  if (body.suministro_agua != null && body.suministro_agua !== '' && !v) return json({ error: 'suministro_agua inválido' }, 400);
	  updates.suministro_agua = v;
	}
	if (body.suministro_gas !== undefined) {
	  const v = pickFrom(body.suministro_gas, GAS);
	  if (body.suministro_gas != null && body.suministro_gas !== '' && !v) return json({ error: 'suministro_gas inválido' }, 400);
	  updates.suministro_gas = v;
	}

	// nº operación
	if (body.numero_operacion !== undefined) {
	  updates.numero_operacion = toIntOrNull(body.numero_operacion);
	}

	// ingreso banco + fecha ingreso (juntos, y permite vaciar ambos)
	const ingresoRaw = body.ingreso_banco;
	const fechaRaw = body.fecha_ingreso;

	const ingresoTouched = ingresoRaw !== undefined;
	const fechaTouched = fechaRaw !== undefined;

	const ingreso_banco = toMoneyOrNull(ingresoRaw);
	const fecha_ingreso = toDateISO(fechaRaw);

	if ((ingresoTouched && !fechaTouched) || (!ingresoTouched && fechaTouched)) {
	  return json({ error: 'ingreso_banco y fecha_ingreso deben informarse juntos' }, 400);
	}

	if (ingresoTouched && fechaTouched) {
	  const bothNull = ingreso_banco == null && fecha_ingreso == null;
	  const bothFilled = ingreso_banco != null && fecha_ingreso != null;

	  if (!bothNull && !bothFilled) {
		return json({ error: 'ingreso_banco y fecha_ingreso deben ir ambos o vacíos ambos' }, 400);
	  }

	  updates.ingreso_banco = ingreso_banco;
	  updates.fecha_ingreso = fecha_ingreso;
	}

	// liquidación
	if (body.liquidacion !== undefined) {
	  const b = toBoolOrNull(body.liquidacion);
	  if (b == null) return json({ error: 'liquidacion inválido' }, 400);
	  updates.liquidacion = b;
	}

	// slug si cambia título
	if (updates.titulo && updates.titulo !== current.titulo) {
	  const base = slugifyEs(updates.titulo) || 'propiedad';
	  updates.slug = await findNextUniqueSlug(supabase, base);
	}

	// Si no hay nada que actualizar, salimos OK (evita “update {}” raro)
	if (Object.keys(updates).length === 0) {
	  return json({ ok: true, id: current.id, slug: current.slug }, 200);
	}

	const { data, error } = await supabase
	  .from('propiedades')
	  .update(updates)
	  .eq('id', id)
	  .select('id, slug, numero_operacion, ingreso_banco, fecha_ingreso, liquidacion, estado')
	  .single();

	if (error) {
	  console.error('[updateProperty] supabase error:', error, { id, updates });
	  return json({ error: error.message, code: (error as any).code, details: (error as any).details }, 500);
	}

	return json({
	  id: data.id,
	  slug: data.slug,
	  numero_operacion: data.numero_operacion,
	  ingreso_banco: data.ingreso_banco,
	  fecha_ingreso: data.fecha_ingreso,
	  liquidacion: data.liquidacion,
	  estado: data.estado,
	});
  } catch (e: any) {
	console.error('[updateProperty] fatal:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};