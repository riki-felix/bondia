import type { Handler } from '@netlify/functions';
import {
  json,
  ok,
  parseBody,
  ensureConfig,
  serviceSupabase,
  emptyOrNull,
  toMoneyOrNull,
  toDateOrNull,
  slugifyEs,
} from './_shared';

const RAREZA = new Set(['edicion_limitada', 'edicion_abierta', 'edicion_desconocida']);
const CONDICION = new Set(['muy_buena', 'buena', 'justa']);

function toBoolOrNull(v: any): boolean | null {
  if (v === true || v === 'true' || v === 1 || v === '1' || v === 'on' || v === 'si' || v === 'Sí') return true;
  if (v === false || v === 'false' || v === 0 || v === '0' || v === 'off' || v === 'no') return false;
  return null;
}

function toYearOrNull(v: any): number | null {
  const s = emptyOrNull(v);
  if (!s) return null;
  const m = String(s).match(/^\d{4}$/);
  if (!m) return null;
  const y = Number(m[0]);
  if (y < 1000 || y > 3000) return null;
  return y;
}

// Acepta JSON string '["url1","url2"]' o array o string simple
function toStringArrayOrNull(v: any): string[] | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);

  const s = String(v).trim();
  if (!s) return null;

  // JSON
  if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
	try {
	  const parsed = JSON.parse(s);
	  if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.trim()).filter(Boolean);
	  if (typeof parsed === 'string') return [parsed.trim()].filter(Boolean);
	} catch {
	  // sigue abajo
	}
  }

  // CSV simple "a,b,c"
  if (s.includes(',')) return s.split(',').map((x) => x.trim()).filter(Boolean);

  return [s];
}

export const handler: Handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') return ok();
  if (event.httpMethod !== 'POST') {
	return json({ error: 'Method not allowed' }, 405);
  }

  try {
	ensureConfig();
	const supabase = serviceSupabase();
	const body = parseBody(event.body);

	const id = emptyOrNull(body.id);
	const nombre = emptyOrNull(body.nombre);
	const descripcion = emptyOrNull(body.descripcion);
	const categoria_id = emptyOrNull(body.categoria_id);
	const propiedad_id = emptyOrNull(body.propiedad_id);

	if (!nombre) {
	  return json({ error: 'El nombre del activo es obligatorio' }, 400);
	}

	// ---------- campos base ----------
	const valor_estimado = toMoneyOrNull(body.valor_estimado);
	const fecha_compra = toDateOrNull(body.fecha_compra);
	const slug = slugifyEs(nombre);

	// ---------- campos media (todas las categorías) ----------
	// Ajusta nombres si en tu formulario usas otros
	const imagen_destacada = emptyOrNull(body.imagen_destacada) || emptyOrNull(body.featured_image);
	const galeria_imagenes = toStringArrayOrNull(body.galeria_imagenes || body.gallery_images);

	// ---------- detectar si la categoría es "Arte" ----------
	let isArte = false;
	if (categoria_id) {
	  const { data: cat, error: catErr } = await supabase
		.from('casa_activo_categorias')
		.select('id,nombre')
		.eq('id', categoria_id)
		.maybeSingle();

	  if (catErr) {
		console.warn('[casa-activo-save] No se pudo leer categoría:', catErr.message);
	  }
	  if (cat?.nombre?.trim().toLowerCase() === 'arte') isArte = true;
	}

	// ---------- preparar payload ----------
	const payload: Record<string, any> = {
	  nombre,
	  slug,
	  descripcion,
	  categoria_id: categoria_id || null,
	  propiedad_id: propiedad_id || null,
	  valor_estimado,
	  fecha_compra,

	  // media para todas
	  imagen_destacada: imagen_destacada || null,
	  galeria_imagenes: galeria_imagenes || null,
	};

	// ---------- campos extra SOLO Arte ----------
	// (si NO es Arte, NO los incluimos => no se pisan)
	const arteExtras: Record<string, any> = {};
	if (isArte) {
	  // Money
	  arteExtras.valor_compra = toMoneyOrNull(body.valor_compra);
	  arteExtras.valor_mercado = toMoneyOrNull(body.valor_mercado);

	  // Date
	  arteExtras.fecha_valor_mercado = toDateOrNull(body.fecha_valor_mercado);

	  // URL
	  arteExtras.fuente_valoracion = emptyOrNull(body.fuente_valoracion);

	  // Año (solo año)
	  arteExtras.anio = toYearOrNull(body.anio || body.año || body.year);

	  // Texto simple
	  arteExtras.origen = emptyOrNull(body.origen);
	  arteExtras.materiales = emptyOrNull(body.materiales);
	  arteExtras.notas = emptyOrNull(body.notas);
	  arteExtras.titulo_original = emptyOrNull(body.titulo_original);

	  // Medidas (cm)
	  arteExtras.medida_ancho_cm = toMoneyOrNull(body.medida_ancho_cm);   // si lo mandas como "12,5"
	  arteExtras.medida_alto_cm = toMoneyOrNull(body.medida_alto_cm);
	  arteExtras.medida_profundo_cm = toMoneyOrNull(body.medida_profundo_cm);

	  // Enums
	  const rareza = emptyOrNull(body.rareza);
	  arteExtras.rareza = rareza && RAREZA.has(rareza) ? rareza : null;

	  const condicion = emptyOrNull(body.condicion);
	  arteExtras.condicion = condicion && CONDICION.has(condicion) ? condicion : null;

	  // Booleans
	  const firma = toBoolOrNull(body.firma);
	  arteExtras.firma = firma;

	  const certificado = toBoolOrNull(body.certificado);
	  arteExtras.certificado = certificado;

	  Object.assign(payload, arteExtras);
	}

	// ---------- si UPDATE, necesitamos comparar valor_mercado para log ----------
	let currentValorMercado: number | null = null;
	if (id && isArte) {
	  const { data: current, error: curErr } = await supabase
		.from('casa_activos')
		.select('id, valor_mercado')
		.eq('id', id)
		.maybeSingle();

	  if (curErr) {
		console.warn('[casa-activo-save] No se pudo leer valor_mercado actual:', curErr.message);
	  } else {
		currentValorMercado = current?.valor_mercado ?? null;
	  }
	}

	// ---------- guardar ----------
	if (id) {
	  // UPDATE
	  const { data, error } = await supabase
		.from('casa_activos')
		.update(payload)
		.eq('id', id)
		.select()
		.single();

	  if (error) {
		console.error('Error actualizando activo de casa:', error);
		return json({ error: 'No se pudo actualizar el activo', detail: error.message }, 500);
	  }

	  // ---------- log cambio valor_mercado ----------
	  if (isArte) {
		const newValorMercado = payload.valor_mercado ?? null;

		const changed =
		  (currentValorMercado ?? null) !== (newValorMercado ?? null) &&
		  !(currentValorMercado == null && newValorMercado == null);

		if (changed) {
		  try {
			const { error: logErr } = await supabase
			  .from('casa_activo_valor_mercado_log')
			  .insert({
				activo_id: id,
				valor_anterior: currentValorMercado,
				valor_nuevo: newValorMercado,
				changed_at: new Date().toISOString(),
				source_url: payload.fuente_valoracion ?? null,
			  });

			if (logErr) {
			  console.warn('[casa-activo-save] No se pudo insertar log valor_mercado:', logErr.message);
			}
		  } catch (e: any) {
			console.warn('[casa-activo-save] Excepción insertando log valor_mercado:', e?.message || e);
		  }
		}
	  }

	  return json({ ok: true, mode: 'edit', activo: data, isArte });
	} else {
	  // INSERT
	  const { data, error } = await supabase
		.from('casa_activos')
		.insert(payload)
		.select()
		.single();

	  if (error) {
		console.error('Error creando activo de casa:', error);
		return json({ error: 'No se pudo crear el activo', detail: error.message }, 500);
	  }

	  // opcional: log inicial si es Arte y viene valor_mercado
	  if (isArte && (payload.valor_mercado ?? null) != null) {
		try {
		  const { error: logErr } = await supabase
			.from('casa_activo_valor_mercado_log')
			.insert({
			  activo_id: data.id,
			  valor_anterior: null,
			  valor_nuevo: payload.valor_mercado,
			  changed_at: new Date().toISOString(),
			  source_url: payload.fuente_valoracion ?? null,
			});

		  if (logErr) {
			console.warn('[casa-activo-save] No se pudo insertar log inicial valor_mercado:', logErr.message);
		  }
		} catch (e: any) {
		  console.warn('[casa-activo-save] Excepción insertando log inicial valor_mercado:', e?.message || e);
		}
	  }

	  return json({ ok: true, mode: 'create', activo: data, isArte });
	}
  } catch (err: any) {
	console.error('Error inesperado en casa-activo-save:', err);
	return json({ error: 'Error interno al guardar el activo' }, 500);
  }
};