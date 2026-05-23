// netlify/functions/_bloqueHandlers.ts
// Shared CRUD handlers for block sections (Casa, Sanyus, etc.)
// Each handler receives table names as parameters — zero business logic duplication.

import {
  ensureConfig, serviceSupabase, json, ok, parseBody,
  toMoneyOrNull, toDateOrNull, emptyOrNull, slugifyEs, pickFrom,
} from './_shared';
import { deleteDocumentsForEntity } from './_documentHandlers';

function cleanupEntityDocuments(table: string, id: string) {
  const bloque = table.startsWith('sanyus_') ? 'sanyus' : 'casa';
  let entityType: 'gasto' | 'ingreso' | 'activo' = 'gasto';
  if (table.includes('ingresos')) entityType = 'ingreso';
  else if (table.includes('activos')) entityType = 'activo';
  return deleteDocumentsForEntity(entityType, id).catch((e) => {
    console.warn(`[delete] documentos ${bloque}/${entityType}:`, e);
  });
}

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
    activo_id: emptyOrNull(body.activo_id),
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
  if (body.activo_id !== undefined) updates.activo_id = emptyOrNull(body.activo_id);
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

  await cleanupEntityDocuments(table, id);

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
    activo_id: emptyOrNull(body.activo_id),
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

const SANYUS_ACTIVOS_TABLE = 'sanyus_activos_v2';

async function resolveInmueblesCategoriaId(
  supabase: ReturnType<typeof serviceSupabase>,
  categTable: string,
): Promise<string | null> {
  const { data } = await supabase.from(categTable).select('id, nombre, slug');
  if (!data?.length) return null;
  const found = data.find(
    (c: { slug: string; nombre: string }) =>
      c.slug === 'inmuebles' || c.nombre.toLowerCase() === 'inmuebles',
  );
  return found?.id ?? null;
}

export async function handleCreateActivo(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const nombre = emptyOrNull(body.nombre) ?? '';
  const slug = nombre ? slugifyEs(nombre) + '-' + Date.now() : 'activo-' + Date.now();

  const valorEstimado = toMoneyOrNull(body.valor_estimado);
  const esInmueble = table === SANYUS_ACTIVOS_TABLE && body.es_inmueble === true;

  let categoriaId = emptyOrNull(body.categoria_id);
  if (esInmueble && !categoriaId) {
    categoriaId = await resolveInmueblesCategoriaId(supabase, 'sanyus_activos_categorias');
  }

  const row: Record<string, unknown> = {
    nombre,
    categoria_id: categoriaId,
    fecha_compra: toDateOrNull(body.fecha_compra),
    precio_compra: toMoneyOrNull(body.precio_compra),
    valor_estimado: valorEstimado,
    fecha_estimacion: valorEstimado != null ? new Date().toISOString().slice(0, 10) : null,
    foto_url: emptyOrNull(body.foto_url),
    notas: body.notas ?? '',
    slug,
  };

  if (table === SANYUS_ACTIVOS_TABLE) {
    row.es_inmueble = esInmueble;
  }

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
  if (body.valor_estimado !== undefined) {
    updates.valor_estimado = toMoneyOrNull(body.valor_estimado);
    updates.fecha_estimacion = new Date().toISOString().slice(0, 10);
  }
  if (body.foto_url !== undefined) updates.foto_url = emptyOrNull(body.foto_url);
  if (body.notas !== undefined) updates.notas = body.notas ?? '';

  if (table === SANYUS_ACTIVOS_TABLE && body.es_inmueble !== undefined) {
    const esInmueble = body.es_inmueble === true;
    updates.es_inmueble = esInmueble;
    if (esInmueble && body.categoria_id === undefined) {
      const { data: current } = await supabase
        .from(table)
        .select('categoria_id')
        .eq('id', id)
        .single();
      if (!current?.categoria_id) {
        const inmueblesId = await resolveInmueblesCategoriaId(supabase, 'sanyus_activos_categorias');
        if (inmueblesId) updates.categoria_id = inmueblesId;
      }
    }
  }

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

// ─── Activo Foto ─────────────────────────────────────────────

export async function handleUploadActivoFoto(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const base64 = body.base64;
  const mimeType = body.mimeType || 'image/jpeg';
  if (!base64) return json({ error: 'base64 requerido' }, 400);

  // Decode base64 to buffer
  const buffer = Buffer.from(base64, 'base64');
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const filePath = `${table}/${id}/foto.${ext}`;

  // Delete existing photo if any
  await supabase.storage.from('activos-fotos').remove([filePath]);

  // Upload new photo
  const { error: uploadError } = await supabase.storage
    .from('activos-fotos')
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) return json({ error: uploadError.message }, 500);

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('activos-fotos')
    .getPublicUrl(filePath);

  const foto_url = urlData.publicUrl;

  // Update the activo with the photo URL
  const { data, error } = await supabase
    .from(table)
    .update({ foto_url })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteActivoFoto(table: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  // Get the current foto_url to extract the path
  const { data: activo } = await supabase
    .from(table)
    .select('foto_url')
    .eq('id', id)
    .single();

  if (activo?.foto_url) {
    // Extract storage path from URL
    const match = activo.foto_url.match(/activos-fotos\/(.+)$/);
    if (match) {
      await supabase.storage.from('activos-fotos').remove([match[1]]);
    }
  }

  // Clear foto_url on the activo
  const { data, error } = await supabase
    .from(table)
    .update({ foto_url: null })
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

// ─── Activo Tags ─────────────────────────────────────────────

export async function handleCreateActivoTag(catalogTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const nombre = emptyOrNull(body.nombre) ?? '';
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const slug = slugifyEs(nombre);
  const color = emptyOrNull(body.color) ?? '#6b7280';

  const { data, error } = await supabase
    .from(catalogTable)
    .insert({ nombre, slug, color })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateActivoTag(catalogTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const updates: Record<string, unknown> = {};
  if (body.nombre !== undefined) {
    updates.nombre = emptyOrNull(body.nombre) ?? '';
    updates.slug = slugifyEs(updates.nombre as string);
  }
  if (body.color !== undefined) updates.color = emptyOrNull(body.color) ?? '#6b7280';

  if (Object.keys(updates).length === 0) return json({ ok: true, id });

  const { data, error } = await supabase
    .from(catalogTable)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteActivoTag(catalogTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase
    .from(catalogTable)
    .delete()
    .eq('id', id);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

export async function handleSyncActivoTags(joinTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const activo_id = emptyOrNull(body.activo_id);
  if (!activo_id) return json({ error: 'activo_id requerido' }, 400);

  const tag_ids: string[] = Array.isArray(body.tag_ids) ? body.tag_ids : [];

  // Delete existing assignments
  const { error: delError } = await supabase
    .from(joinTable)
    .delete()
    .eq('activo_id', activo_id);

  if (delError) return json({ error: delError.message }, 500);

  // Insert new assignments
  if (tag_ids.length > 0) {
    const rows = tag_ids.map((tag_id) => ({ activo_id, tag_id }));
    const { error: insertError } = await supabase
      .from(joinTable)
      .insert(rows);

    if (insertError) return json({ error: insertError.message }, 500);
  }

  return json({ ok: true, activo_id, tag_ids });
}

// ─── Activo Características ──────────────────────────────────

export async function handleCreateCaracteristica(catalogTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const nombre = emptyOrNull(body.nombre) ?? '';
  if (!nombre) return json({ error: 'nombre requerido' }, 400);

  const slug = slugifyEs(nombre);
  const categoria_id = emptyOrNull(body.categoria_id);

  const { data, error } = await supabase
    .from(catalogTable)
    .insert({ nombre, slug, categoria_id })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

const SANYUS_CARACTERISTICAS_TABLE = 'sanyus_activos_caracteristicas';

async function isPlantillaInmuebleCaracteristica(
  supabase: ReturnType<typeof serviceSupabase>,
  catalogTable: string,
  id: string,
): Promise<boolean> {
  if (catalogTable !== SANYUS_CARACTERISTICAS_TABLE) return false;
  const { data } = await supabase
    .from(catalogTable)
    .select('plantilla_inmueble')
    .eq('id', id)
    .single();
  return data?.plantilla_inmueble === true;
}

export async function handleUpdateCaracteristica(catalogTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  if (await isPlantillaInmuebleCaracteristica(supabase, catalogTable, id)) {
    if (body.nombre !== undefined) {
      return json({ error: 'No se puede renombrar una característica de plantilla inmueble' }, 400);
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.nombre !== undefined) {
    updates.nombre = emptyOrNull(body.nombre) ?? '';
    updates.slug = slugifyEs(updates.nombre as string);
  }
  if (body.categoria_id !== undefined) updates.categoria_id = emptyOrNull(body.categoria_id);

  if (Object.keys(updates).length === 0) return json({ ok: true, id });

  const { data, error } = await supabase
    .from(catalogTable)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteCaracteristica(catalogTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  if (await isPlantillaInmuebleCaracteristica(supabase, catalogTable, id)) {
    return json({ error: 'No se puede eliminar una característica de plantilla inmueble' }, 400);
  }

  const { error } = await supabase
    .from(catalogTable)
    .delete()
    .eq('id', id);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}

export async function handleSyncCaracteristicaValores(valoresTable: string, body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const activo_id = emptyOrNull(body.activo_id);
  if (!activo_id) return json({ error: 'activo_id requerido' }, 400);

  const valores: Array<{ caracteristica_id: string; valor: string }> = Array.isArray(body.valores) ? body.valores : [];

  // Delete existing values for this activo
  const { error: delError } = await supabase
    .from(valoresTable)
    .delete()
    .eq('activo_id', activo_id);

  if (delError) return json({ error: delError.message }, 500);

  // Insert new values (skip empty)
  const rows = valores
    .filter((v) => v.valor && v.valor.trim())
    .map((v) => ({ activo_id, caracteristica_id: v.caracteristica_id, valor: v.valor.trim() }));

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from(valoresTable)
      .insert(rows);

    if (insertError) return json({ error: insertError.message }, 500);
  }

  return json({ ok: true, activo_id, count: rows.length });
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

  // Build update payload — nombre or favorito (or both)
  const updates: Record<string, unknown> = {};

  if (body.nombre !== undefined) {
    const nombre = emptyOrNull(body.nombre);
    if (!nombre) return json({ error: 'nombre requerido' }, 400);
    updates.nombre = nombre;
    updates.slug = slugifyEs(nombre);
  }

  if (body.favorito !== undefined) {
    updates.favorito = !!body.favorito;
  }

  if (Object.keys(updates).length === 0) {
    return json({ error: 'nada que actualizar' }, 400);
  }

  const { data, error } = await supabase
    .from(table)
    .update(updates)
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

// ─── Feature Tasks (Ajustes) ────────────────────────────────

function parseProgress(value: any): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

export async function handleCreateFeatureTask(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const titulo = emptyOrNull(body.titulo);
  if (!titulo) return json({ error: 'titulo requerido' }, 400);

  const descripcion = emptyOrNull(body.descripcion) ?? '';
  const progreso = parseProgress(body.progreso);

  const { data, error } = await supabase
    .from('feature_tasks')
    .insert({ titulo, descripcion, progreso })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleUpdateFeatureTask(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const updates: Record<string, unknown> = {};

  if (body.titulo !== undefined) {
    const titulo = emptyOrNull(body.titulo);
    if (!titulo) return json({ error: 'titulo no puede estar vacío' }, 400);
    updates.titulo = titulo;
  }

  if (body.descripcion !== undefined) {
    updates.descripcion = emptyOrNull(body.descripcion) ?? '';
  }

  if (body.progreso !== undefined) {
    updates.progreso = parseProgress(body.progreso);
  }

  if (Object.keys(updates).length === 0) return json({ ok: true, id });

  const { data, error } = await supabase
    .from('feature_tasks')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export async function handleDeleteFeatureTask(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase.from('feature_tasks').delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return ok();
}

// ─── Cartera ─────────────────────────────────────────────────

const CARTERAS = new Set(['inversiones', 'familiar', 'sanyus', 'ahorro']);

export async function handleCreateMovimientoCartera(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const origen = pickFrom(body.origen, CARTERAS);
  const destino = pickFrom(body.destino, CARTERAS);
  if (!origen || !destino) return json({ error: 'origen y destino requeridos' }, 400);
  if (origen === destino) return json({ error: 'origen y destino deben ser diferentes' }, 400);

  const concepto = emptyOrNull(body.concepto) ?? '';
  if (!concepto) return json({ error: 'concepto requerido' }, 400);

  const importe = toMoneyOrNull(body.importe);
  if (importe == null || importe <= 0) return json({ error: 'importe debe ser > 0' }, 400);

  const fecha = toDateOrNull(body.fecha) ?? new Date().toISOString().slice(0, 10);
  const ejercicio = Number(body.ejercicio);
  if (!Number.isFinite(ejercicio)) return json({ error: 'ejercicio requerido' }, 400);

  const { data, error } = await supabase
    .from('cartera_movimientos')
    .insert({ origen, destino, concepto, importe, fecha, ejercicio })
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
}

export async function handleDeleteMovimientoCartera(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const { error } = await supabase.from('cartera_movimientos').delete().eq('id', id);
  if (error) return json({ error: error.message }, 500);
  return ok();
}

export async function handleUpdateAhorroCartera(body: any) {
  ensureConfig();
  const supabase = serviceSupabase();

  const importe = toMoneyOrNull(body.importe);
  if (importe == null) return json({ error: 'importe requerido' }, 400);

  const { data, error } = await supabase
    .from('cartera_ajustes')
    .update({ importe, updated_at: new Date().toISOString() })
    .eq('cartera', 'ahorro')
    .select('*')
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
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
