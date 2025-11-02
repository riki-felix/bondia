// netlify/functions/createProperty.ts
import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''

// ---------- helpers base ----------
function parseBody(body?: string | null) {
  if (!body) return {}
  try { return JSON.parse(body) } catch { return {} }
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
  }
}
const PERIOD = new Set(['mensual','trimestral','anual'])
const ESTADO = new Set(['tanteo','negociacion','compra','reforma','alquiler','vendido'])
const LUZ  = new Set(['sin_suministro','pinchada','contratada'])
const AGUA = new Set(['sin_suministro','pinchada','contratada'])
const GAS  = new Set(['sin_suministro','pinchado','contratado'])
const TIPO = new Set(['inversion','activo']);

function emptyToNull(v: any) {
  if (v == null) return null
  const s = String(v).trim()
  return s === '' ? null : s
}
function toIntOrNull(v: any): number | null {
  if (v == null || v === '') return null
  const n = Number(String(v).trim())
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null
  return n
}
function toYearOrNull(v: any): number | null {
  const n = toIntOrNull(v)
  if (n == null) return null
  if (n < 1000 || n > 2100) return null
  return n
}
// "12,34" -> "12.34" (sin miles)
function normalizeMoneyLike(v: any): string | null {
  if (v == null) return null
  let s = String(v).trim()
  if (!s) return null
  s = s.replace(/\s+/g, '')
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (hasComma && hasDot) {
	s = s.replace(/\./g, '')
	const last = s.lastIndexOf(',')
	const intPart = s.slice(0, last).replace(/,/g, '')
	const decPart = s.slice(last + 1)
	s = intPart + (decPart ? ('.' + decPart) : '')
  } else if (hasComma) {
	s = s.replace(/\./g, '')
	const last = s.lastIndexOf(',')
	const intPart = s.slice(0, last).replace(/,/g, '')
	const decPart = s.slice(last + 1)
	s = intPart + (decPart ? ('.' + decPart) : '')
  } else {
	const last = s.lastIndexOf('.')
	if (last >= 0) {
	  const intPart = s.slice(0, last).replace(/\./g, '')
	  const decPart = s.slice(last + 1)
	  s = intPart + (decPart ? ('.' + decPart) : '')
	}
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null
  return s
}
function toMoneyOrNull(v: any): number | null {
  const canon = normalizeMoneyLike(v)
  if (canon == null) return null
  const n = Number(canon)
  if (!Number.isFinite(n)) return null
  if (Math.trunc(Math.abs(n)) >= 1_000_000_000) return null
  return Number(n.toFixed(2))
}
function toDateISO(v: any): string | null {
  const s = emptyToNull(v)
  if (!s) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}
function pickFrom(v: any, allowed: Set<string>): string | null {
  if (typeof v !== 'string') return null
  const x = v.trim().toLowerCase()
  return allowed.has(x) ? x : null
}

// ---------- handler ----------
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
	return { statusCode: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }, body: '' }
  }
  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
	if (!/^https?:\/\//i.test(SUPABASE_URL)) throw new Error('Config: SUPABASE_URL ausente o inválida')
	if (!SUPABASE_SERVICE_ROLE) throw new Error('Config: SUPABASE_SERVICE_ROLE ausente')

	const body = parseBody(event.body)

	// Requisito mínimo
	const titulo = String(body?.titulo || '').trim()
	if (!titulo) return json({ error: 'Falta título' }, 400)

	// Campos
	const superficie_m2     = toIntOrNull(body?.superficie_m2)
	const anio_construccion = toYearOrNull(body?.anio_construccion)
	const numero_catastro   = emptyToNull(body?.numero_catastro)
	const precio_compra     = toMoneyOrNull(body?.precio_compra)
	const precio_venta     = toMoneyOrNull(body?.precio_venta)
	const alquiler_previsto = toMoneyOrNull(body?.alquiler_previsto)
	const valor_catastro    = toMoneyOrNull(body?.valor_catastro)

	const fecha_compra         = toDateISO(body?.fecha_compra)
	const valor_ite            = toMoneyOrNull(body?.valor_ite)
	const coste_administrador  = toMoneyOrNull(body?.coste_administrador)
	const cuota_comunidad      = toMoneyOrNull(body?.cuota_comunidad)
	const periodicidad_cuota   = pickFrom(body?.periodicidad_cuota, PERIOD)
	const ibi                  = toMoneyOrNull(body?.ibi)
	const estado               = pickFrom(body?.estado, ESTADO)

	const suministro_luz  = pickFrom(body?.suministro_luz,  LUZ)
	const suministro_agua = pickFrom(body?.suministro_agua, AGUA)
	const suministro_gas  = pickFrom(body?.suministro_gas,  GAS)

	// Opcionalmente paths (si decides crearlos desde server en algún flujo)
	const foto_destacada_path = emptyToNull(body?.foto_destacada_path)
	const plano_path          = emptyToNull(body?.plano_path)

	const tipo = (typeof body?.tipo === 'string') ? body.tipo.trim().toLowerCase() : null;
	if (!tipo || !TIPO.has(tipo)) {
	  return json({ error: 'tipo requerido (inversion|activo)' }, 400);
	}
	
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
	  auth: { persistSession: false, autoRefreshToken: false },
	})
	
	
	const payload: Record<string, any> = { titulo }
	if (tipo != null) payload.tipo = tipo
	if (superficie_m2 != null) payload.superficie_m2 = superficie_m2
	if (anio_construccion != null) payload.anio_construccion = anio_construccion
	if (numero_catastro != null) payload.numero_catastro = numero_catastro
	if (precio_compra != null) payload.precio_compra = precio_compra
	if (precio_venta != null) payload.precio_venta = precio_venta
	if (alquiler_previsto != null) payload.alquiler_previsto = alquiler_previsto
	if (valor_catastro != null) payload.valor_catastro = valor_catastro

	if (fecha_compra != null) payload.fecha_compra = fecha_compra
	if (valor_ite != null) payload.valor_ite = valor_ite
	if (coste_administrador != null) payload.coste_administrador = coste_administrador
	if (cuota_comunidad != null) payload.cuota_comunidad = cuota_comunidad
	if (periodicidad_cuota != null) payload.periodicidad_cuota = periodicidad_cuota
	if (ibi != null) payload.ibi = ibi
	if (estado != null) payload.estado = estado

	if (suministro_luz != null)  payload.suministro_luz  = suministro_luz
	if (suministro_agua != null) payload.suministro_agua = suministro_agua
	if (suministro_gas != null)  payload.suministro_gas  = suministro_gas

	if (foto_destacada_path != null) payload.foto_destacada_path = foto_destacada_path
	if (plano_path != null)          payload.plano_path = plano_path

	const { data, error } = await supabase
	  .from('propiedades')
	  .insert(payload)
	  .select('id, slug')
	  .single()

	if (error) {
	  console.error('[createProperty] insert error:', error)
	  return json({ error: error.message || 'insert_error', details: (error as any).details, code: (error as any).code }, 500)
	}

	return json({ id: data.id, slug: data.slug }, 201)
  } catch (e: any) {
	console.error('[createProperty] fatal:', e)
	return json({ error: e.message || 'Unexpected error' }, 500)
  }
}