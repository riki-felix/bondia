// netlify/functions/updateProperty.ts
import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { ensureLiquidacionForInversion } from './_shared';
import { normalizeDireccionPostal } from './_normalizeDireccion';

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PERIOD = new Set(['mensual', 'bimensual', 'trimestral', 'anual']);
const ESTADO = new Set(['borrador', 'activa', 'sin_estado', 'tanteo', 'negociacion', 'comprado', 'reforma', 'alquiler', 'vendido']);
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

function toPctOrNull(v: any): number | null {
  if (v == null || v === '') return null;
  const s = String(v).trim().replace('%', '').replace(',', '.');
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0 || n > 100) return null;
  return Number(n.toFixed(3));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function calcJaspFromBruto(bruto: number, pctJasp: number): number {
  return round2(bruto * (pctJasp / 100));
}

async function recalcLiquidacionesYPropiedad(
  supabase: any,
  propiedadId: string,
  participacionSanyus: number,
  participacionJasp: number,
  jaspManual: boolean,
  jaspStored: number | null
) {
  const { data: liqs } = await supabase
    .from('liquidaciones')
    .select('id, retribucion')
    .eq('propiedad_id', propiedadId);

  let totalBruto = 0;
  let totalRetribucion = 0;

  for (const l of liqs ?? []) {
    const retribucion = Number(l.retribucion) || 0;
    totalRetribucion += retribucion;
    const bruto =
      retribucion > 0 && participacionSanyus > 0
        ? round2((retribucion * 100) / participacionSanyus)
        : 0;
    totalBruto += bruto;
    await supabase
      .from('liquidaciones')
      .update({ beneficio_bruto: bruto })
      .eq('id', l.id);
  }

  const propUpdates: Record<string, unknown> = {
    retribucion: round2(totalRetribucion),
  };
  if (!jaspManual) {
    propUpdates.jasp_10_percent = calcJaspFromBruto(totalBruto, participacionJasp);
    propUpdates.jasp_manual = false;
  }

  await supabase.from('propiedades').update(propUpdates).eq('id', propiedadId);
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
	if (body.direccion !== undefined) {
	  updates.direccion = normalizeDireccionPostal(emptyOrNull(body.direccion));
	}
	if (body.origen !== undefined) updates.origen = emptyOrNull(body.origen);
	if (body.notas !== undefined) updates.notas = emptyOrNull(body.notas);
	if (body.superficie_m2 !== undefined) updates.superficie_m2 = toIntOrNull(body.superficie_m2);
	if (body.superficie_registrada_m2 !== undefined) {
	  updates.superficie_registrada_m2 = toIntOrNull(body.superficie_registrada_m2);
	}
	if (body.superficie_real_m2 !== undefined) updates.superficie_real_m2 = toIntOrNull(body.superficie_real_m2);
	if (body.anio_construccion !== undefined) updates.anio_construccion = toYearOrNull(body.anio_construccion);
	if (body.numero_catastro !== undefined) {
	  updates.numero_catastro = emptyOrNull(body.numero_catastro);
	  if (!updates.numero_catastro && body.catastro_validado_at === undefined) {
		updates.catastro_referencia_validada = null;
		updates.catastro_validado_at = null;
	  }
	}
	if (body.catastro_referencia_validada !== undefined) {
	  updates.catastro_referencia_validada = emptyOrNull(body.catastro_referencia_validada);
	}
	if (body.catastro_validado_at !== undefined) {
	  updates.catastro_validado_at = body.catastro_validado_at || null;
	}
	if (body.fecha_compra !== undefined) updates.fecha_compra = toDateISO(body.fecha_compra);
	if (body.created_at !== undefined) {
	  const d = toDateISO(body.created_at);
	  updates.created_at = d ? `${d}T12:00:00.000Z` : null;
	}
	if (body.transfe !== undefined) {
	  const d = toDateISO(body.transfe);
	  updates.transfe = d ? `${d}T12:00:00.000Z` : null;
	}
	if (body.aportacion !== undefined) {
	  updates.aportacion = toMoneyOrNull(body.aportacion) ?? 0;
	}
	if (body.jasp_10_percent !== undefined) {
	  updates.jasp_10_percent = toMoneyOrNull(body.jasp_10_percent) ?? 0;
	}
	if (body.jasp_manual !== undefined) {
	  const b = toBoolOrNull(body.jasp_manual);
	  if (b == null) return json({ error: 'jasp_manual inválido' }, 400);
	  updates.jasp_manual = b;
	}

	// ✅ MEDIA (esto es lo que te faltaba)
	// Si llega undefined, NO toca el campo (no lo borra).
	// Si llega "" o null, lo vacía.
	if (body.foto_destacada_path !== undefined) updates.foto_destacada_path = emptyOrNull(body.foto_destacada_path);
	if (body.plano_path !== undefined) updates.plano_path = emptyOrNull(body.plano_path);

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
	  const norm = normalizeEstado(body.estado);
	  if (norm == null) {
		updates.estado = null;
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

	// nº operación (ID visible en Inversiones; solo propiedad)
	if (body.numero_operacion !== undefined) {
	  updates.numero_operacion = toIntOrNull(body.numero_operacion);
	}

	// ejercicio (año fiscal) — la liquidación es la fuente de verdad; se refleja en propiedad
	if (body.ejercicio !== undefined) {
	  const ej = toIntOrNull(body.ejercicio);
	  updates.ejercicio = ej;
	  await supabase.from('liquidaciones').update({ ejercicio: ej }).eq('propiedad_id', id);
	}

	// ingreso banco + fecha ingreso (independientes en update parcial)
	if (body.ingreso_banco !== undefined) {
	  const ing = toMoneyOrNull(body.ingreso_banco);
	  updates.ingreso_banco = ing;
	  updates.pago = (Number(ing) || 0) > 0;
	}
	if (body.fecha_ingreso !== undefined) {
	  updates.fecha_ingreso = toDateISO(body.fecha_ingreso);
	}

	// liquidación — sincroniza liquidado en la liquidación vinculada
	if (body.liquidacion !== undefined) {
	  const b = toBoolOrNull(body.liquidacion);
	  if (b == null) return json({ error: 'liquidacion inválido' }, 400);
	  updates.liquidacion = b;
	  await supabase.from('liquidaciones').update({ liquidado: b }).eq('propiedad_id', id);
	}

	// ocupado
	if (body.ocupado !== undefined) {
	  const b = toBoolOrNull(body.ocupado);
	  if (b == null) return json({ error: 'ocupado inválido' }, 400);
	  updates.ocupado = b;
	}

	// fecha_venta
	if (body.fecha_venta !== undefined) {
	  updates.fecha_venta = toDateISO(body.fecha_venta);
	}

	if (body.participacion_sanyus !== undefined) {
	  const p = toPctOrNull(body.participacion_sanyus);
	  if (body.participacion_sanyus != null && body.participacion_sanyus !== '' && p == null) {
		return json({ error: 'participacion_sanyus inválida (0-100)' }, 400);
	  }
	  updates.participacion_sanyus = p;
	}
	if (body.participacion_jasp !== undefined) {
	  const p = toPctOrNull(body.participacion_jasp);
	  if (body.participacion_jasp != null && body.participacion_jasp !== '' && p == null) {
		return json({ error: 'participacion_jasp inválida (0-100)' }, 400);
	  }
	  updates.participacion_jasp = p;
	}
	if (body.participacion_bienes_sanyus_cb !== undefined) {
	  const p = toPctOrNull(body.participacion_bienes_sanyus_cb);
	  if (
		body.participacion_bienes_sanyus_cb != null &&
		body.participacion_bienes_sanyus_cb !== '' &&
		p == null
	  ) {
		return json({ error: 'participacion_bienes_sanyus_cb inválida (0-100)' }, 400);
	  }
	  updates.participacion_bienes_sanyus_cb = p;
	}

	const needsRecalc =
	  updates.participacion_sanyus !== undefined ||
	  updates.participacion_jasp !== undefined;

	// slug si cambia título
	if (updates.titulo && updates.titulo !== current.titulo) {
	  const base = slugifyEs(updates.titulo) || 'propiedad';
	  updates.slug = await findNextUniqueSlug(supabase, base);
	}

	if (updates.aportacion !== undefined) {
	  await supabase
		.from('liquidaciones')
		.update({ aportacion: updates.aportacion })
		.eq('propiedad_id', id);
	}

	if (Object.keys(updates).length === 0) {
	  return json({ ok: true, id: current.id, slug: current.slug }, 200);
	}

	const { data, error } = await supabase
	  .from('propiedades')
	  .update(updates)
	  .eq('id', id)
	  .select('id, slug, tipo, numero_operacion, ingreso_banco, fecha_ingreso, liquidacion, estado, foto_destacada_path, plano_path')
	  .single();

	if (error) {
	  console.error('[updateProperty] supabase error:', error, { id, updates });
	  return json({ error: error.message, code: (error as any).code, details: (error as any).details }, 500);
	}

	if (data.tipo === 'inversion') {
	  const { error: liqErr } = await ensureLiquidacionForInversion(supabase, id, {
	    ejercicio: updates.ejercicio ?? null,
	    liquidado: updates.liquidacion ?? undefined,
	  });
	  if (liqErr) {
	    console.error('[updateProperty] ensure liquidacion:', liqErr);
	    return json({ error: liqErr }, 500);
	  }
	}

	if (needsRecalc) {
	  const { data: fin } = await supabase
		.from('propiedades')
		.select('participacion_sanyus, participacion_jasp, jasp_manual, jasp_10_percent')
		.eq('id', id)
		.single();
	  if (fin) {
		const sanyus = fin.participacion_sanyus ?? 40;
		const jasp = fin.participacion_jasp ?? 20;
		if (sanyus + jasp > 100) {
		  return json({ error: 'Sanyus + JASP no pueden superar el 100%' }, 400);
		}
		await recalcLiquidacionesYPropiedad(
		  supabase,
		  id,
		  sanyus,
		  jasp,
		  fin.jasp_manual,
		  fin.jasp_10_percent
		);
	  }
	}

	return json({
	  id: data.id,
	  slug: data.slug,
	  numero_operacion: data.numero_operacion,
	  ingreso_banco: data.ingreso_banco,
	  fecha_ingreso: data.fecha_ingreso,
	  liquidacion: data.liquidacion,
	  estado: data.estado,
	  foto_destacada_path: (data as any).foto_destacada_path ?? null,
	  plano_path: (data as any).plano_path ?? null,
	});
  } catch (e: any) {
	console.error('[updateProperty] fatal:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};