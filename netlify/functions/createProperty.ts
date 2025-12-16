// netlify/functions/createProperty.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

function parseBody(body?: string | null) {
  if (!body) return {};
  try {
	return JSON.parse(body);
  } catch {
	return {};
  }
}

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

const PERIOD = new Set(['mensual', 'bimensual', 'trimestral', 'anual']);
const ESTADO = new Set(['tanteo', 'negociacion', 'comprado', 'reforma', 'alquiler', 'vendido']);
const LUZ = new Set(['sin_suministro', 'pinchado', 'pinchada', 'contratado', 'contratada']);
const AGUA = new Set(['sin_suministro', 'pinchado', 'pinchada', 'contratado', 'contratada']);
const GAS = new Set(['sin_suministro', 'pinchado', 'pinchada', 'contratado', 'contratada']);
const TIPO = new Set(['inversion', 'activo']);

function emptyToNull(v: any) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function toIntOrNull(v: any): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = parseInt(s, 10);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toYearOrNull(v: any): number | null {
  const n = toIntOrNull(v);
  if (n == null) return null;
  if (n < 1000 || n > 2100) return null;
  return n;
}

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
  if (Math.trunc(Math.abs(n)) >= 1_000_000_000) return null;
  return Number(n.toFixed(2));
}

function toDateISO(v: any): string | null {
  const s = emptyToNull(v);
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
	if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('Config: SUPABASE_URL ausente o inválida');
	if (!SUPABASE_SERVICE_ROLE) throw new Error('Config: SUPABASE_SERVICE_ROLE ausente');

	const body = parseBody(event.body);

	const titulo = String(body?.titulo || '').trim();
	if (!titulo) return json({ error: 'Falta título' }, 400);

	const tipo = (typeof body?.tipo === 'string') ? body.tipo.trim().toLowerCase() : null;
	if (!tipo || !TIPO.has(tipo)) return json({ error: 'tipo requerido (inversion|activo)' }, 400);

	const direccion = emptyToNull(body?.direccion);
	const superficie_m2 = toIntOrNull(body?.superficie_m2);
	const anio_construccion = toYearOrNull(body?.anio_construccion);
	const numero_catastro = emptyToNull(body?.numero_catastro);
	const fecha_compra = toDateISO(body?.fecha_compra);

	const precio_compra = toMoneyOrNull(body?.precio_compra);
	const precio_venta = toMoneyOrNull(body?.precio_venta);
	const alquiler_previsto = toMoneyOrNull(body?.alquiler_previsto);

	const valor_catastro = toMoneyOrNull(body?.valor_catastro);
	const valor_ite = toMoneyOrNull(body?.valor_ite);
	const coste_administrador = toMoneyOrNull(body?.coste_administrador);
	const cuota_comunidad = toMoneyOrNull(body?.cuota_comunidad);

	const periodicidad_cuota =
	  (body?.periodicidad_cuota == null || body?.periodicidad_cuota === '')
		? null
		: pickFrom(body?.periodicidad_cuota, PERIOD);
	if (body?.periodicidad_cuota != null && body?.periodicidad_cuota !== '' && !periodicidad_cuota) {
	  return json({ error: 'periodicidad_cuota inválida' }, 400);
	}

	const ibi = toMoneyOrNull(body?.ibi);

	let estado: string | null = null;
	if (body?.estado !== undefined) {
	  const e = pickFrom(body?.estado, ESTADO);
	  if (!e) return json({ error: 'estado inválido' }, 400);
	  estado = e;
	}

	const suministro_luz =
	  (body?.suministro_luz == null || body?.suministro_luz === '')
		? null
		: pickFrom(body?.suministro_luz, LUZ);
	if (body?.suministro_luz != null && body?.suministro_luz !== '' && !suministro_luz) {
	  return json({ error: 'suministro_luz inválido' }, 400);
	}

	const suministro_agua =
	  (body?.suministro_agua == null || body?.suministro_agua === '')
		? null
		: pickFrom(body?.suministro_agua, AGUA);
	if (body?.suministro_agua != null && body?.suministro_agua !== '' && !suministro_agua) {
	  return json({ error: 'suministro_agua inválido' }, 400);
	}

	const suministro_gas =
	  (body?.suministro_gas == null || body?.suministro_gas === '')
		? null
		: pickFrom(body?.suministro_gas, GAS);
	if (body?.suministro_gas != null && body?.suministro_gas !== '' && !suministro_gas) {
	  return json({ error: 'suministro_gas inválido' }, 400);
	}

	const foto_destacada_path = emptyToNull(body?.foto_destacada_path);
	const plano_path = emptyToNull(body?.plano_path);

	let numero_operacion = toIntOrNull(body?.numero_operacion);

	const ingreso_banco = toMoneyOrNull(body?.ingreso_banco);
	const fecha_ingreso = toDateISO(body?.fecha_ingreso);

	const ingresoTouched = body?.ingreso_banco !== undefined;
	const fechaTouched = body?.fecha_ingreso !== undefined;

	if ((ingresoTouched && !fechaTouched) || (!ingresoTouched && fechaTouched)) {
	  return json({ error: 'ingreso_banco y fecha_ingreso deben informarse juntos' }, 400);
	}
	if (ingresoTouched && fechaTouched) {
	  const bothNull = ingreso_banco == null && fecha_ingreso == null;
	  const bothFilled = ingreso_banco != null && fecha_ingreso != null;
	  if (!bothNull && !bothFilled) {
		return json({ error: 'ingreso_banco y fecha_ingreso deben ir ambos o vacíos ambos' }, 400);
	  }
	}

	const liquidacionParsed = (body?.liquidacion === undefined) ? null : toBoolOrNull(body?.liquidacion);
	if (body?.liquidacion !== undefined && liquidacionParsed == null) {
	  return json({ error: 'liquidacion inválido' }, 400);
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
	  auth: { persistSession: false, autoRefreshToken: false },
	});

	if (numero_operacion == null) {
	  const { data: last, error: lastErr } = await supabase
		.from('propiedades')
		.select('numero_operacion')
		.not('numero_operacion', 'is', null)
		.order('numero_operacion', { ascending: false })
		.limit(1)
		.maybeSingle();

	  if (lastErr) {
		console.error('[createProperty] max(numero_operacion) error:', lastErr);
		return json({ error: lastErr.message || 'max_numero_operacion_error' }, 500);
	  }

	  const prev = (last && last.numero_operacion != null) ? Number(last.numero_operacion) : 0;
	  numero_operacion = prev + 1;
	}

	const payload: Record<string, any> = { titulo, tipo };

	if (direccion != null) payload.direccion = direccion;
	if (superficie_m2 != null) payload.superficie_m2 = superficie_m2;
	if (anio_construccion != null) payload.anio_construccion = anio_construccion;
	if (numero_catastro != null) payload.numero_catastro = numero_catastro;
	if (fecha_compra != null) payload.fecha_compra = fecha_compra;

	if (precio_compra != null) payload.precio_compra = precio_compra;
	if (precio_venta != null) payload.precio_venta = precio_venta;
	if (alquiler_previsto != null) payload.alquiler_previsto = alquiler_previsto;

	if (valor_catastro != null) payload.valor_catastro = valor_catastro;
	if (valor_ite != null) payload.valor_ite = valor_ite;
	if (coste_administrador != null) payload.coste_administrador = coste_administrador;
	if (cuota_comunidad != null) payload.cuota_comunidad = cuota_comunidad;
	if (periodicidad_cuota != null) payload.periodicidad_cuota = periodicidad_cuota;
	if (ibi != null) payload.ibi = ibi;

	if (estado != null) payload.estado = estado;
	if (suministro_luz != null) payload.suministro_luz = suministro_luz;
	if (suministro_agua != null) payload.suministro_agua = suministro_agua;
	if (suministro_gas != null) payload.suministro_gas = suministro_gas;

	if (foto_destacada_path != null) payload.foto_destacada_path = foto_destacada_path;
	if (plano_path != null) payload.plano_path = plano_path;

	payload.numero_operacion = numero_operacion;

	if (ingresoTouched && fechaTouched) {
	  payload.ingreso_banco = ingreso_banco;
	  payload.fecha_ingreso = fecha_ingreso;
	}

	if (liquidacionParsed != null) payload.liquidacion = liquidacionParsed;

	const { data, error } = await supabase
	  .from('propiedades')
	  .insert(payload)
	  .select('id, slug, numero_operacion, ingreso_banco, fecha_ingreso, liquidacion')
	  .single();

	if (error) {
	  console.error('[createProperty] insert error:', error);
	  return json(
		{ error: error.message || 'insert_error', details: (error as any).details, code: (error as any).code },
		500
	  );
	}

	return json(
	  {
		id: data.id,
		slug: data.slug,
		numero_operacion: data.numero_operacion,
		ingreso_banco: data.ingreso_banco,
		fecha_ingreso: data.fecha_ingreso,
		liquidacion: data.liquidacion,
	  },
	  201
	);
  } catch (e: any) {
	console.error('[createProperty] fatal:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};