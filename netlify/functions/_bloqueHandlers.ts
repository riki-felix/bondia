// netlify/functions/_bloqueHandlers.ts
// Shared CRUD handlers for block sections (Casa, Sanyus, etc.)
// Each handler receives table names as parameters — zero business logic duplication.

import {
  ensureConfig, serviceSupabase, json, ok, parseBody,
  toMoneyOrNull, toDateOrNull, emptyOrNull, slugifyEs, pickFrom,
} from './_shared';

const FREQ = new Set([
  'semanal','quincenal','mensual','bimensual',
  'trimestral','semestral','anual','puntual','variable',
]);

const VALID_TIPOS = new Set(['gasto', 'ingreso', 'activo']);
const VALID_OVERRIDE_TYPES = new Set(['gasto', 'ingreso']);

// ─── Gasto ───────────────────────────────────────────────────

export async function handleCreateGasto(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const ejercicio = Number(body.ejercicio);
  if (!Number.isFinite(ejercicio)) return json({ error: 'ejercicio requerido' }, 400);

  const concepto = emptyOrNull(body.concepto) ?? '';
  const frecuencia = pickFrom(body.frecuencia, FREQ) ?? 'mensual';
  const slug = concepto ? slugifyEs(concepto) + '-' + Date.now() : 'gasto-' + Date.now();

  const row = {
    concepto,
    categoria_id: emptyOrNull(body.categoria_id),
    frecuencia,
    fecha_inicio: toDateOrNull(body.fecha_inicio),
    fecha_fin: toDateOrNull(body.fecha_fin),
    importe: toMoneyOrNull(body.importe) ?? 0,
    ejercicio,
    slug,
  };

  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateGasto(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const updates: Record<string, unknown> = {};

  if (body.concepto !== undefined) updates.concepto = emptyOrNull(body.concepto) ?? '';
  if (body.categoria_id !== undefined) updates.categoria_id = emptyOrNull(body.categoria_id);
  if (body.frecuencia !== undefined) {
    const f = pickFrom(body.frecuencia, FREQ);
    if (f) updates.frecuencia = f;
  }
  if (body.fecha_inicio !== undefined) updates.fecha_inicio = toDateOrNull(body.fecha_inicio);
  if (body.fecha_fin !== undefined) updates.fecha_fin = toDateOrNull(body.fecha_fin);
  if (body.importe !== undefined) updates.importe = toMoneyOrNull(body.importe) ?? 0;
  if (body.ejercicio !== undefined) {
    const ej = Number(body.ejercicio);
    if (Number.isFinite(ej)) updates.ejercicio = ej;
  }
  if (body.metodo_pago_id !== undefined) updates.metodo_pago_id = emptyOrNull(body.metodo_pago_id);

  if (Object.keys(updates).length === 0) return json({ ok: true, id });

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteGasto(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return ok();
}

// ─── Ingreso ─────────────────────────────────────────────────

export async function handleCreateIngreso(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const ejercicio = Number(body.ejercicio);
  if (!Number.isFinite(ejercicio)) return json({ error: 'ejercicio requerido' }, 400);

  const concepto = emptyOrNull(body.concepto) ?? '';
  const frecuencia = pickFrom(body.frecuencia, FREQ) ?? 'mensual';
  const slug = concepto ? slugifyEs(concepto) + '-' + Date.now() : 'ingreso-' + Date.now();

  const row = {
    concepto,
    categoria_id: emptyOrNull(body.categoria_id),
    frecuencia,
    fecha_inicio: toDateOrNull(body.fecha_inicio),
    fecha_fin: toDateOrNull(body.fecha_fin),
    importe: toMoneyOrNull(body.importe) ?? 0,
    ejercicio,
    slug,
  };

  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateIngreso(table: string, body: any) {
  // Same logic as updateGasto — fields are identical
  return handleUpdateGasto(table, body);
}

export async function handleDeleteIngreso(table: string, body: any) {
  return handleDeleteGasto(table, body);
}

// ─── Activo ──────────────────────────────────────────────────

export async function handleCreateActivo(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const nombre = emptyOrNull(body.nombre) ?? '';
  const slug = nombre ? slugifyEs(nombre) + '-' + Date.now() : 'activo-' + Date.now();

  const row = {
    nombre,
    categoria_id: emptyOrNull(body.categoria_id),
    fecha_compra: toDateOrNull(body.fecha_compra),
    precio_compra: toMoneyOrNull(body.precio_compra),
    notas: body.notas ?? '',
    slug,
  };

  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateActivo(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const updates: Record<string, unknown> = {};

  if (body.nombre !== undefined) updates.nombre = emptyOrNull(body.nombre) ?? '';
  if (body.categoria_id !== undefined) updates.categoria_id = emptyOrNull(body.categoria_id);
  if (body.fecha_compra !== undefined) updates.fecha_compra = toDateOrNull(body.fecha_compra);
  if (body.precio_compra !== undefined) updates.precio_compra = toMoneyOrNull(body.precio_compra);
  if (body.notas !== undefined) updates.notas = body.notas ?? '';

  if (Object.keys(updates).length === 0) return json({ ok: true, id });

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteActivo(table: string, body: any) {
  return handleDeleteGasto(table, body);
}

// ─── Categoria ───────────────────────────────────────────────

export async function handleCreateCategoria(
  tableMap: Record<string, string>,
  body: any
) {
  ensureConfig();
  const supabase = serviceSupabase();

  const tipo = body.tipo;
  const table = tableMap[tipo];
  if (!table) return json({ error: 'tipo debe ser "gasto", "ingreso" o "activo"' }, 400);

  const nombre = emptyOrNull(body.nombre);
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const slug = slugifyEs(nombre);

  const { data, error } = await supabase
    .from(table)
    .upsert({ nombre, slug }, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateCategoria(
  tableMap: Record<string, string>,
  body: any
) {
  ensureConfig();
  const supabase = serviceSupabase();

  const tipo = body.tipo;
  const table = tableMap[tipo];
  if (!table) return json({ error: 'tipo debe ser "gasto", "ingreso" o "activo"' }, 400);

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const nombre = emptyOrNull(body.nombre);
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const slug = slugifyEs(nombre);

  const { data, error } = await supabase
    .from(table)
    .update({ nombre, slug })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteCategoria(
  tableMap: Record<string, string>,
  body: any
) {
  ensureConfig();
  const supabase = serviceSupabase();

  const tipo = body.tipo;
  const table = tableMap[tipo];
  if (!table) return json({ error: 'tipo debe ser "gasto", "ingreso" o "activo"' }, 400);

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return ok();
}

// ─── Area ────────────────────────────────────────────────────

export async function handleCreateArea(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const nombre = emptyOrNull(body.nombre);
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const slug = slugifyEs(nombre);

  const { data, error } = await supabase
    .from(table)
    .upsert({ nombre, slug }, { onConflict: 'slug' })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateArea(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const nombre = emptyOrNull(body.nombre);
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const slug = slugifyEs(nombre);

  const { data, error } = await supabase
    .from(table)
    .update({ nombre, slug })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteArea(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

// ─── Sync Area Categorías ────────────────────────────────────

export async function handleSyncAreaCategorias(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const area_id = emptyOrNull(body.area_id);
  if (!area_id) return json({ error: 'area_id requerido' }, 400);

  const categorias: { tipo: string; categoria_id: string }[] = body.categorias;
  if (!Array.isArray(categorias)) return json({ error: 'categorias debe ser un array' }, 400);

  for (const c of categorias) {
    if (!VALID_TIPOS.has(c.tipo)) return json({ error: `tipo inválido: ${c.tipo}` }, 400);
    if (!c.categoria_id) return json({ error: 'categoria_id requerido en cada elemento' }, 400);
  }

  // Delete existing
  const { error: delError } = await supabase
    .from(table)
    .delete()
    .eq('area_id', area_id);

  if (delError) return json({ error: delError.message }, 500);

  // Insert new
  if (categorias.length > 0) {
    const rows = categorias.map((c) => ({
      area_id,
      tipo: c.tipo,
      categoria_id: c.categoria_id,
    }));

    const { error: insError } = await supabase.from(table).insert(rows);
    if (insError) return json({ error: insError.message }, 500);
  }

  // Return updated
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('area_id', area_id);

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

// ─── Upsert Override ─────────────────────────────────────────

export async function handleUpsertOverride(
  gastosOverridesTable: string,
  ingresosOverridesTable: string,
  body: any
) {
  ensureConfig();
  const supabase = serviceSupabase();

  const tipo = body.tipo;
  if (!tipo || !VALID_OVERRIDE_TYPES.has(tipo)) return json({ error: 'tipo debe ser "gasto" o "ingreso"' }, 400);

  const itemId = emptyOrNull(body.item_id);
  if (!itemId) return json({ error: 'item_id requerido' }, 400);

  const ejercicio = Number(body.ejercicio);
  if (!Number.isFinite(ejercicio)) return json({ error: 'ejercicio requerido' }, 400);

  const mes = Number(body.mes);
  if (!Number.isFinite(mes) || mes < 1 || mes > 12) return json({ error: 'mes debe ser 1-12' }, 400);

  const importe = toMoneyOrNull(body.importe) ?? 0;

  const table = tipo === 'gasto' ? gastosOverridesTable : ingresosOverridesTable;
  const fkField = tipo === 'gasto' ? 'gasto_id' : 'ingreso_id';

  const { data, error } = await supabase
    .from(table)
    .upsert(
      { [fkField]: itemId, ejercicio, mes, importe },
      { onConflict: `${fkField},ejercicio,mes` }
    )
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

// ─── Métodos de Pago (global) ────────────────────────────────

const METODO_TIPOS = new Set(['tarjeta', 'efectivo', 'transferencia', 'paypal']);
const METODO_ALCANCES = new Set(['casa', 'sanyus', 'ambos']);

export async function handleCreateMetodoPago(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const nombre = emptyOrNull(body.nombre);
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const tipo = pickFrom(body.tipo, METODO_TIPOS);
  if (!tipo) return json({ error: 'tipo debe ser tarjeta, efectivo, transferencia o paypal' }, 400);

  const alcance = pickFrom(body.alcance, METODO_ALCANCES) ?? 'ambos';

  const { data, error } = await supabase
    .from('metodos_pago')
    .insert({ nombre, tipo, alcance, activo: true })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateMetodoPago(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const updates: Record<string, unknown> = {};

  if (body.nombre !== undefined) {
    const n = emptyOrNull(body.nombre);
    if (!n) return json({ error: 'nombre no puede estar vacío' }, 400);
    updates.nombre = n;
  }
  if (body.tipo !== undefined) {
    const t = pickFrom(body.tipo, METODO_TIPOS);
    if (!t) return json({ error: 'tipo inválido' }, 400);
    updates.tipo = t;
  }
  if (body.alcance !== undefined) {
    const a = pickFrom(body.alcance, METODO_ALCANCES);
    if (!a) return json({ error: 'alcance inválido' }, 400);
    updates.alcance = a;
  }
  if (body.activo !== undefined) updates.activo = !!body.activo;

  if (Object.keys(updates).length === 0) return json({ ok: true, id });

  const { data, error } = await supabase
    .from('metodos_pago')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteMetodoPago(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase.from('metodos_pago').delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return ok();
}

// ─── CORS preflight helper ───────────────────────────────────

export function corsPreflightResponse() {
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

// ─── Standard handler wrapper ────────────────────────────────

export function wrapHandler(
  handler: (body: any) => Promise<any>,
  label: string
) {
  return async (event: any) => {
    if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

    try {
      const body = parseBody(event.body);
      const result = await handler(body);
      // Guard: ensure we always return a valid response object
      if (!result || typeof result.statusCode !== 'number') {
        console.error(`[${label}] handler returned invalid response:`, result);
        return json({ error: 'Respuesta inválida del servidor' }, 500);
      }
      return result;
    } catch (e: any) {
      console.error(`[${label}] fatal:`, e);
      return json({ error: e.message || 'Error inesperado' }, 500);
    }
  };
}
