// netlify/functions/_documentHandlers.ts
import {
  ensureConfig,
  serviceSupabase,
  json,
  ok,
  emptyOrNull,
  slugifyEs,
  parseBody,
} from './_shared';
type DocumentEntityType = 'propiedad' | 'activo' | 'gasto' | 'ingreso';
type DocumentBloque = 'engine' | 'casa' | 'sanyus';

interface DocumentEntityConfig {
  entityType: DocumentEntityType;
  bloque: DocumentBloque;
  table: string;
  pathSegment: string;
  labelField: string;
  href: (id: string) => string;
}

function configKey(bloque: DocumentBloque, entityType: DocumentEntityType): string {
  if (entityType === 'propiedad') return 'propiedad';
  return `${bloque}-${entityType}`;
}

const DOCUMENT_ENTITY_CONFIGS: Record<string, DocumentEntityConfig> = {
  propiedad: {
    entityType: 'propiedad',
    bloque: 'engine',
    table: 'propiedades',
    pathSegment: 'propiedades',
    labelField: 'titulo',
    href: (id) => `/propiedades/${id}`,
  },
  'casa-activo': {
    entityType: 'activo',
    bloque: 'casa',
    table: 'casa_activos_v2',
    pathSegment: 'activos',
    labelField: 'nombre',
    href: (id) => `/casa/activos/${id}`,
  },
  'sanyus-activo': {
    entityType: 'activo',
    bloque: 'sanyus',
    table: 'sanyus_activos_v2',
    pathSegment: 'activos',
    labelField: 'nombre',
    href: (id) => `/sanyus/activos/${id}`,
  },
  'casa-gasto': {
    entityType: 'gasto',
    bloque: 'casa',
    table: 'casa_gastos',
    pathSegment: 'gastos',
    labelField: 'concepto',
    href: () => '/casa/gastos',
  },
  'sanyus-gasto': {
    entityType: 'gasto',
    bloque: 'sanyus',
    table: 'sanyus_gastos',
    pathSegment: 'gastos',
    labelField: 'concepto',
    href: () => '/sanyus/gastos',
  },
  'casa-ingreso': {
    entityType: 'ingreso',
    bloque: 'casa',
    table: 'casa_ingresos',
    pathSegment: 'ingresos',
    labelField: 'concepto',
    href: () => '/casa/ingresos',
  },
  'sanyus-ingreso': {
    entityType: 'ingreso',
    bloque: 'sanyus',
    table: 'sanyus_ingresos',
    pathSegment: 'ingresos',
    labelField: 'concepto',
    href: () => '/sanyus/ingresos',
  },
};

function getDocumentEntityConfig(
  bloque: DocumentBloque,
  entityType: DocumentEntityType
): DocumentEntityConfig | null {
  return DOCUMENT_ENTITY_CONFIGS[configKey(bloque, entityType)] ?? null;
}

const BUCKET = 'bondia-documentos';
const SIGNED_URL_TTL = 60 * 60; // 1 hora

const ENTITY_TYPES = new Set<DocumentEntityType>(['propiedad', 'activo', 'gasto', 'ingreso']);
const BLOQUES = new Set<DocumentBloque>(['engine', 'casa', 'sanyus']);

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'documento';
  return base.slice(0, 120);
}

function extFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('image/')) {
    const sub = mime.split('/')[1]?.replace('jpeg', 'jpg').replace('pjpeg', 'jpg');
    return sub || 'img';
  }
  return 'bin';
}

export function buildStoragePath(
  cfg: DocumentEntityConfig,
  entityId: string,
  folderSlug: string,
  documentId: string,
  displayName: string,
  mimeType: string
): string {
  const ext = displayName.includes('.')
    ? displayName.split('.').pop()?.toLowerCase() || extFromMime(mimeType)
    : extFromMime(mimeType);
  const safeName = sanitizeFileName(displayName.replace(/\.[^.]+$/, ''));
  return `${cfg.bloque}/${cfg.pathSegment}/${entityId}/${folderSlug}/${documentId}-${safeName}.${ext}`;
}

function resolveConfig(body: { entityType?: string; bloque?: string }) {
  const entityType = emptyOrNull(body.entityType) as DocumentEntityType | null;
  const bloque = emptyOrNull(body.bloque) as DocumentBloque | null;
  if (!entityType || !ENTITY_TYPES.has(entityType)) {
    return { error: json({ error: 'entityType inválido' }, 400) };
  }
  if (!bloque || !BLOQUES.has(bloque)) {
    return { error: json({ error: 'bloque inválido' }, 400) };
  }
  const cfg = getDocumentEntityConfig(bloque, entityType);
  if (!cfg) return { error: json({ error: 'Configuración de entidad no encontrada' }, 400) };
  return { entityType, bloque, cfg };
}

async function loadEntityRow(
  supabase: ReturnType<typeof serviceSupabase>,
  cfg: DocumentEntityConfig,
  entityId: string
) {
  const { data, error } = await supabase
    .from(cfg.table)
    .select('*')
    .eq('id', entityId)
    .maybeSingle();
  if (error) return { error: json({ error: error.message }, 500) };
  if (!data) return { error: json({ error: 'Entidad no encontrada' }, 404) };
  return { row: data as unknown as { id: string; [k: string]: unknown } };
}

function folderSlugFromRow(cfg: DocumentEntityConfig, row: Record<string, unknown>): string {
  const label = row[cfg.labelField];
  const s = label != null ? String(label).trim() : '';
  if (s) return slugifyEs(s) || `entidad-${String(row.id).slice(0, 8)}`;
  return `entidad-${String(row.id).slice(0, 8)}`;
}

async function nextSortOrder(
  supabase: ReturnType<typeof serviceSupabase>,
  entityType: DocumentEntityType,
  entityId: string,
  folderSlug?: string
): Promise<number> {
  let query = supabase
    .from('documentos')
    .select('sort_order')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (folderSlug) query = query.eq('folder_slug', folderSlug);
  const { data } = await query.order('sort_order', { ascending: false }).limit(1);
  const max = data?.[0]?.sort_order ?? 0;
  return max + 10;
}

export async function deleteDocumentsForEntity(
  entityType: DocumentEntityType,
  entityId: string
) {
  ensureConfig();
  const supabase = serviceSupabase();
  const { data: docs } = await supabase
    .from('documentos')
    .select('id, storage_path')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);

  if (docs?.length) {
    const paths = docs.map((d) => d.storage_path);
    await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from('documentos').delete().eq('entity_type', entityType).eq('entity_id', entityId);
  }
}

export async function handleListDocuments(body: any) {
  ensureConfig();
  const resolved = resolveConfig(body);
  if ('error' in resolved && resolved.error) return resolved.error;
  const { entityType } = resolved;
  const entityId = emptyOrNull(body.entityId);
  if (!entityId) return json({ error: 'entityId requerido' }, 400);

  const supabase = serviceSupabase();
  const folderSlug = emptyOrNull(body.folderSlug);
  const excludeFolderSlug = emptyOrNull(body.excludeFolderSlug);

  let query = supabase
    .from('documentos')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (folderSlug) query = query.eq('folder_slug', folderSlug);
  if (excludeFolderSlug) query = query.neq('folder_slug', excludeFolderSlug);

  const { data, error } = await query.order('sort_order', { ascending: true });

  if (error) return json({ error: error.message }, 500);
  return json({ documents: data ?? [] });
}

export async function handleUploadDocument(body: any) {
  ensureConfig();
  const resolved = resolveConfig(body);
  if ('error' in resolved && resolved.error) return resolved.error;
  const { entityType, bloque, cfg } = resolved;

  const entityId = emptyOrNull(body.entityId);
  if (!entityId) return json({ error: 'entityId requerido' }, 400);

  const base64 = body.base64;
  const mimeType = (body.mimeType || 'application/octet-stream').toLowerCase();
  const displayName = emptyOrNull(body.displayName) || 'documento';
  if (!base64) return json({ error: 'base64 requerido' }, 400);

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length === 0) return json({ error: 'Archivo vacío' }, 400);

  const supabase = serviceSupabase();
  const entityRes = await loadEntityRow(supabase, cfg, entityId);
  if ('error' in entityRes && entityRes.error) return entityRes.error;
  const row = entityRes.row!;

  const folderSlugOverride = emptyOrNull(body.folderSlug);
  const folderSlug = folderSlugOverride || folderSlugFromRow(cfg, row);
  const documentId = crypto.randomUUID();
  const storage_path = buildStoragePath(cfg, entityId, folderSlug, documentId, displayName, mimeType);
  const sort_order = await nextSortOrder(supabase, entityType, entityId, folderSlugOverride || undefined);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storage_path, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) return json({ error: uploadError.message }, 500);

  const { data, error } = await supabase
    .from('documentos')
    .insert({
      id: documentId,
      entity_type: entityType,
      entity_id: entityId,
      bloque,
      storage_path,
      folder_slug: folderSlug,
      display_name: displayName,
      mime_type: mimeType,
      size_bytes: buffer.length,
      sort_order,
    })
    .select('*')
    .single();

  if (error) {
    await supabase.storage.from(BUCKET).remove([storage_path]);
    return json({ error: error.message }, 500);
  }

  return json(data, 201);
}

export async function handleUpdateDocument(body: any) {
  ensureConfig();
  const id = emptyOrNull(body.id);
  const displayName = emptyOrNull(body.displayName);
  if (!id) return json({ error: 'id requerido' }, 400);
  if (!displayName) return json({ error: 'displayName requerido' }, 400);

  const supabase = serviceSupabase();
  const { data, error } = await supabase
    .from('documentos')
    .update({ display_name: displayName })
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: 'Documento no encontrado' }, 404);
  return json(data);
}

export async function handleReorderDocuments(body: any) {
  ensureConfig();
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) {
    return json({ error: 'items requerido (array de { id, sort_order })' }, 400);
  }

  const supabase = serviceSupabase();
  for (const item of items) {
    const id = emptyOrNull(item.id);
    const sort_order = Number(item.sort_order);
    if (!id || !Number.isFinite(sort_order)) continue;
    const { error } = await supabase.from('documentos').update({ sort_order }).eq('id', id);
    if (error) return json({ error: error.message }, 500);
  }
  return json({ ok: true });
}

export async function handleDeleteDocument(body: any) {
  ensureConfig();
  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const supabase = serviceSupabase();
  const { data: doc, error: fetchErr } = await supabase
    .from('documentos')
    .select('storage_path')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return json({ error: fetchErr.message }, 500);
  if (!doc) return json({ error: 'Documento no encontrado' }, 404);

  const { error: delDb } = await supabase.from('documentos').delete().eq('id', id);
  if (delDb) return json({ error: delDb.message }, 500);

  await supabase.storage.from(BUCKET).remove([doc.storage_path]);
  return ok();
}

export async function handleGetDocumentSignedUrl(body: any) {
  ensureConfig();
  const id = emptyOrNull(body.id);
  if (!id) return json({ error: 'id requerido' }, 400);

  const supabase = serviceSupabase();
  const { data: doc, error } = await supabase
    .from('documentos')
    .select('storage_path, mime_type, display_name')
    .eq('id', id)
    .maybeSingle();

  if (error) return json({ error: error.message }, 500);
  if (!doc) return json({ error: 'Documento no encontrado' }, 404);

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(doc.storage_path, SIGNED_URL_TTL);

  if (signErr || !signed?.signedUrl) {
    return json({ error: signErr?.message || 'No se pudo generar URL' }, 500);
  }

  return json({
    url: signed.signedUrl,
    mime_type: doc.mime_type,
    display_name: doc.display_name,
    expiresIn: SIGNED_URL_TTL,
  });
}

const CATEGORIA_JOIN: Record<string, string> = {
  casa_gastos: 'casa_gastos_categorias(nombre)',
  casa_ingresos: 'casa_ingresos_categorias(nombre)',
  casa_activos_v2: 'casa_activos_categorias(nombre)',
  sanyus_gastos: 'sanyus_gastos_categorias(nombre)',
  sanyus_ingresos: 'sanyus_ingresos_categorias(nombre)',
  sanyus_activos_v2: 'sanyus_activos_categorias(nombre)',
};

const CATEGORIA_TABLE: Record<string, string> = {
  'casa-gasto': 'casa_gastos_categorias',
  'casa-ingreso': 'casa_ingresos_categorias',
  'casa-activo': 'casa_activos_categorias',
  'sanyus-gasto': 'sanyus_gastos_categorias',
  'sanyus-ingreso': 'sanyus_ingresos_categorias',
  'sanyus-activo': 'sanyus_activos_categorias',
};

function buildDocumentCountMaps(rows: { bloque: string; entity_type: string; entity_id: string }[]) {
  const perEntity = new Map<string, number>();
  const perSection = new Map<string, number>();
  for (const row of rows) {
    const entityKey = `${row.bloque}:${row.entity_type}:${row.entity_id}`;
    perEntity.set(entityKey, (perEntity.get(entityKey) ?? 0) + 1);
    const sectionKey = `${row.bloque}:${row.entity_type}`;
    perSection.set(sectionKey, (perSection.get(sectionKey) ?? 0) + 1);
  }
  return { perEntity, perSection };
}

export async function handleListDocumentsTree() {
  ensureConfig();
  const supabase = serviceSupabase();

  const { data: counts } = await supabase
    .from('documentos')
    .select('entity_type, entity_id, bloque');

  const { perEntity, perSection } = buildDocumentCountMaps(counts ?? []);

  async function entitiesForPropiedades() {
    const cfg = getDocumentEntityConfig('engine', 'propiedad')!;
    const { data, error } = await supabase
      .from(cfg.table)
      .select('id, titulo, created_at')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return (data as { id: string; titulo: string | null; created_at: string }[]).map((row) => {
      const id = String(row.id);
      const label = String(row.titulo ?? id).trim() || id;
      const ck = `engine:propiedad:${id}`;
      return {
        id,
        label,
        href: cfg.href(id),
        documentCount: perEntity.get(ck) ?? 0,
      };
    });
  }

  async function sectionSummary(bloque: DocumentBloque, entityType: DocumentEntityType) {
    const cfg = getDocumentEntityConfig(bloque, entityType);
    if (!cfg) return { entityCount: 0, documentCount: 0 };
    const { count, error } = await supabase
      .from(cfg.table)
      .select('*', { count: 'exact', head: true });
    if (error) return { entityCount: 0, documentCount: 0 };
    return {
      entityCount: count ?? 0,
      documentCount: perSection.get(`${bloque}:${entityType}`) ?? 0,
    };
  }

  const propiedades = await entitiesForPropiedades();

  return json({
    tree: {
      engine: { propiedades },
      casa: {
        gastos: await sectionSummary('casa', 'gasto'),
        ingresos: await sectionSummary('casa', 'ingreso'),
        activos: await sectionSummary('casa', 'activo'),
      },
      sanyus: {
        gastos: await sectionSummary('sanyus', 'gasto'),
        ingresos: await sectionSummary('sanyus', 'ingreso'),
        activos: await sectionSummary('sanyus', 'activo'),
      },
    },
  });
}

export async function handleListDocumentEntities(body: any) {
  ensureConfig();
  const resolved = resolveConfig(body);
  if ('error' in resolved && resolved.error) return resolved.error;
  const { entityType, bloque, cfg } = resolved;

  if (entityType === 'propiedad') {
    return json({ error: 'Usar el árbol de propiedades' }, 400);
  }

  const q = emptyOrNull(body.q);
  const ejercicioRaw = body.ejercicio;
  const ejercicio =
    ejercicioRaw != null && ejercicioRaw !== '' && ejercicioRaw !== 'all'
      ? Number(ejercicioRaw)
      : null;
  const hasDocuments = body.hasDocuments === true || body.hasDocuments === 'true';
  const sort = emptyOrNull(body.sort) || 'created_desc';
  const categoriaId = emptyOrNull(body.categoriaId);

  const supabase = serviceSupabase();

  const { data: docRows } = await supabase
    .from('documentos')
    .select('entity_id')
    .eq('bloque', bloque)
    .eq('entity_type', entityType);

  const countMap = new Map<string, number>();
  for (const row of docRows ?? []) {
    countMap.set(row.entity_id, (countMap.get(row.entity_id) ?? 0) + 1);
  }

  const catJoin = CATEGORIA_JOIN[cfg.table];
  let selectStr = `id, ${cfg.labelField}, created_at, categoria_id`;
  if (entityType === 'gasto' || entityType === 'ingreso') selectStr += ', ejercicio';
  if (catJoin) selectStr += `, ${catJoin}`;

  let query = supabase.from(cfg.table).select(selectStr);

  if (q) {
    query = query.ilike(cfg.labelField, `%${q}%`);
  }
  if (ejercicio != null && Number.isFinite(ejercicio) && (entityType === 'gasto' || entityType === 'ingreso')) {
    query = query.eq('ejercicio', ejercicio);
  }
  if (categoriaId && categoriaId !== 'all') {
    if (categoriaId === '__none__') {
      query = query.is('categoria_id', null);
    } else {
      query = query.eq('categoria_id', categoriaId);
    }
  }

  const ascending = sort === 'created_asc' || sort === 'name_asc';
  if (sort === 'name_asc' || sort === 'name_desc') {
    query = query.order(cfg.labelField, { ascending, nullsFirst: false });
  } else {
    query = query.order('created_at', { ascending, nullsFirst: false });
  }

  const { data, error } = await query.limit(500);
  if (error) return json({ error: error.message }, 500);

  type Row = Record<string, unknown> & {
    id: string;
    created_at: string;
    ejercicio?: number;
  };

  let entities = ((data ?? []) as unknown as Row[]).map((row) => {
    const id = String(row.id);
    const label = String(row[cfg.labelField] ?? id).trim() || id;
    let categoria_nombre: string | null = null;
    const joinKey = Object.keys(row).find((k) => k.includes('categorias'));
    if (joinKey) {
      const rel = row[joinKey] as { nombre?: string } | { nombre?: string }[] | null;
      if (Array.isArray(rel)) categoria_nombre = rel[0]?.nombre ?? null;
      else if (rel && typeof rel === 'object') categoria_nombre = rel.nombre ?? null;
    }
    const categoria_id =
      row.categoria_id != null ? String(row.categoria_id) : null;
    return {
      id,
      label,
      href: cfg.href(id),
      created_at: row.created_at,
      ejercicio: row.ejercicio ?? null,
      categoria_id,
      categoria_nombre,
      documentCount: countMap.get(id) ?? 0,
    };
  });

  if (hasDocuments) {
    entities = entities.filter((e) => e.documentCount > 0);
  }

  return json({ entities });
}

export async function handleListDocumentEntityCategories(body: any) {
  ensureConfig();
  const resolved = resolveConfig(body);
  if ('error' in resolved && resolved.error) return resolved.error;
  const { bloque, entityType } = resolved;

  const table = CATEGORIA_TABLE[configKey(bloque, entityType)];
  if (!table) return json({ categories: [] });

  const supabase = serviceSupabase();
  const { data, error } = await supabase
    .from(table)
    .select('id, nombre')
    .order('nombre', { ascending: true });

  if (error) return json({ error: error.message }, 500);

  return json({
    categories: (data ?? []).map((c: { id: string; nombre: string }) => ({
      id: c.id,
      nombre: c.nombre,
    })),
  });
}

const ENTITY_SEARCH_TARGETS: { bloque: DocumentBloque; entityType: DocumentEntityType }[] = [
  { bloque: 'engine', entityType: 'propiedad' },
  { bloque: 'casa', entityType: 'gasto' },
  { bloque: 'casa', entityType: 'ingreso' },
  { bloque: 'casa', entityType: 'activo' },
  { bloque: 'sanyus', entityType: 'gasto' },
  { bloque: 'sanyus', entityType: 'ingreso' },
  { bloque: 'sanyus', entityType: 'activo' },
];

function entityBreadcrumb(bloque: DocumentBloque, entityType: DocumentEntityType, label: string) {
  const section = bloque === 'engine' ? 'Engine' : bloque === 'casa' ? 'Casa' : 'Sanyus';
  const typeLabel =
    entityType === 'propiedad'
      ? 'Propiedades'
      : entityType === 'activo'
        ? 'Activos'
        : entityType === 'gasto'
          ? 'Gastos'
          : 'Ingresos';
  return `${section} / ${typeLabel} / ${label}`;
}

export async function handleSearchDocuments(body: any) {
  ensureConfig();
  const qRaw = emptyOrNull(body.q) ?? '';
  const q = qRaw.toLowerCase();
  if (!q) return json({ entities: [], files: [] });

  const bloqueFilter = emptyOrNull(body.bloque) as DocumentBloque | null;
  const entityTypeFilter = emptyOrNull(body.entityType) as DocumentEntityType | null;
  const entityIdFilter = emptyOrNull(body.entityId);

  const supabase = serviceSupabase();

  const { data: allDocs } = await supabase
    .from('documentos')
    .select('entity_type, entity_id, bloque');

  const countMap = new Map<string, number>();
  for (const row of allDocs ?? []) {
    const key = `${row.bloque}:${row.entity_type}:${row.entity_id}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const entityResults: Array<Record<string, unknown>> = [];
  const seenEntityKeys = new Set<string>();

  for (const { bloque, entityType } of ENTITY_SEARCH_TARGETS) {
    if (bloqueFilter && bloque !== bloqueFilter) continue;
    if (entityTypeFilter && entityType !== entityTypeFilter) continue;

    const cfg = getDocumentEntityConfig(bloque, entityType);
    if (!cfg) continue;

    const { data, error } = await supabase
      .from(cfg.table)
      .select(`id, ${cfg.labelField}`)
      .ilike(cfg.labelField, `%${qRaw}%`)
      .limit(30);

    if (error || !data) continue;

    for (const row of data as unknown as Record<string, unknown>[]) {
      const id = String(row.id);
      if (entityIdFilter && id !== entityIdFilter) continue;
      const entityKey = `${bloque}:${entityType}:${id}`;
      if (seenEntityKeys.has(entityKey)) continue;
      seenEntityKeys.add(entityKey);

      const label = String(row[cfg.labelField] ?? id).trim() || id;
      entityResults.push({
        id,
        label,
        href: cfg.href(id),
        bloque,
        entity_type: entityType,
        breadcrumb: entityBreadcrumb(bloque, entityType, label),
        documentCount: countMap.get(entityKey) ?? 0,
      });
    }
  }

  entityResults.sort((a, b) =>
    String(a.label).localeCompare(String(b.label), 'es', { sensitivity: 'base' })
  );

  let query = supabase.from('documentos').select('*').order('created_at', { ascending: false });

  if (bloqueFilter && BLOQUES.has(bloqueFilter)) query = query.eq('bloque', bloqueFilter);
  if (entityTypeFilter && ENTITY_TYPES.has(entityTypeFilter)) {
    query = query.eq('entity_type', entityTypeFilter);
  }
  if (entityIdFilter) query = query.eq('entity_id', entityIdFilter);

  const { data: docs, error } = await query.limit(200);
  if (error) return json({ error: error.message }, 500);

  const fileResults: Array<Record<string, unknown>> = [];
  const labelCache = new Map<string, string>();

  for (const doc of docs ?? []) {
    const cfg = getDocumentEntityConfig(doc.bloque as DocumentBloque, doc.entity_type as DocumentEntityType);
    if (!cfg) continue;

    const cacheKey = `${cfg.table}:${doc.entity_id}`;
    let entityLabel = labelCache.get(cacheKey) ?? '';
    if (!entityLabel) {
      const { data: row } = await supabase
        .from(cfg.table)
        .select('*')
        .eq('id', doc.entity_id)
        .maybeSingle();
      const rowObj = row as unknown as Record<string, unknown> | null;
      entityLabel = rowObj
        ? String(rowObj[cfg.labelField] ?? doc.entity_id)
        : String(doc.entity_id);
      labelCache.set(cacheKey, entityLabel);
    }

    const nameMatch = doc.display_name?.toLowerCase().includes(q);
    const entityMatch = entityLabel.toLowerCase().includes(q);
    if (!nameMatch && !entityMatch) continue;

    fileResults.push({
      ...doc,
      entity_label: entityLabel,
      entity_href: cfg.href(doc.entity_id),
      breadcrumb: entityBreadcrumb(
        doc.bloque as DocumentBloque,
        doc.entity_type as DocumentEntityType,
        entityLabel
      ),
    });
    if (fileResults.length >= 80) break;
  }

  return json({
    entities: entityResults.slice(0, 80),
    files: fileResults,
  });
}

function corsPreflightResponse() {
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

// ─── Handler wrapper ─────────────────────────────────────────

export function wrapDocumentHandler(
  handler: (body: any) => Promise<any>,
  label: string
) {
  return async (event: { httpMethod?: string; body?: string | null }) => {
    if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

    try {
      const body = parseBody(event.body);
      const result = await handler(body);
      if (!result || typeof result.statusCode !== 'number') {
        console.error(`[${label}] invalid response:`, result);
        return json({ error: 'Respuesta inválida del servidor' }, 500);
      }
      return result;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error inesperado';
      console.error(`[${label}] fatal:`, e);
      return json({ error: msg }, 500);
    }
  };
}
