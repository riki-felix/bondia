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
const MAX_BYTES = 10 * 1024 * 1024;
const SIGNED_URL_TTL = 60 * 60; // 1 hora

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
]);

const ENTITY_TYPES = new Set<DocumentEntityType>(['propiedad', 'activo', 'gasto', 'ingreso']);
const BLOQUES = new Set<DocumentBloque>(['engine', 'casa', 'sanyus']);

function sanitizeFileName(name: string): string {
  const base = name.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'documento';
  return base.slice(0, 120);
}

function extFromMime(mime: string): string {
  if (mime === 'application/pdf') return 'pdf';
  return 'jpg';
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
  entityId: string
): Promise<number> {
  const { data } = await supabase
    .from('documentos')
    .select('sort_order')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('sort_order', { ascending: false })
    .limit(1);
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
  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('sort_order', { ascending: true });

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
  const mimeType = (body.mimeType || '').toLowerCase();
  const displayName = emptyOrNull(body.displayName) || 'documento';
  if (!base64) return json({ error: 'base64 requerido' }, 400);
  if (!ALLOWED_MIMES.has(mimeType)) {
    return json({ error: 'Tipo de archivo no permitido (PDF o JPG)' }, 400);
  }

  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > MAX_BYTES) {
    return json({ error: `Archivo demasiado grande (máx ${MAX_BYTES / 1024 / 1024} MB)` }, 400);
  }
  if (buffer.length === 0) return json({ error: 'Archivo vacío' }, 400);

  const supabase = serviceSupabase();
  const entityRes = await loadEntityRow(supabase, cfg, entityId);
  if ('error' in entityRes && entityRes.error) return entityRes.error;
  const row = entityRes.row!;

  const folderSlug = folderSlugFromRow(cfg, row);
  const documentId = crypto.randomUUID();
  const storage_path = buildStoragePath(cfg, entityId, folderSlug, documentId, displayName, mimeType);
  const sort_order = await nextSortOrder(supabase, entityType, entityId);

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

export async function handleListDocumentsTree() {
  ensureConfig();
  const supabase = serviceSupabase();

  const { data: counts } = await supabase
    .from('documentos')
    .select('entity_type, entity_id, bloque');

  const countMap = new Map<string, number>();
  for (const row of counts ?? []) {
    const key = `${row.bloque}:${row.entity_type}:${row.entity_id}`;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  async function entitiesFor(
    cfg: ReturnType<typeof getDocumentEntityConfig>,
    entityType: DocumentEntityType,
    bloque: DocumentBloque
  ) {
    if (!cfg) return [];
    const { data, error } = await supabase
      .from(cfg.table)
      .select('*')
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as Record<string, unknown>[]).map((row) => {
      const id = String(row.id);
      const label = String(row[cfg.labelField] ?? id).trim() || id;
      const ck = `${bloque}:${entityType}:${id}`;
      return {
        id,
        label,
        href: cfg.href(id),
        documentCount: countMap.get(ck) ?? 0,
      };
    });
  }

  const propCfg = getDocumentEntityConfig('engine', 'propiedad')!;
  const propiedades = await entitiesFor(propCfg, 'propiedad', 'engine');

  const casaActivos = await entitiesFor(
    getDocumentEntityConfig('casa', 'activo'),
    'activo',
    'casa'
  );
  const casaGastos = await entitiesFor(getDocumentEntityConfig('casa', 'gasto'), 'gasto', 'casa');
  const casaIngresos = await entitiesFor(
    getDocumentEntityConfig('casa', 'ingreso'),
    'ingreso',
    'casa'
  );

  const sanyusActivos = await entitiesFor(
    getDocumentEntityConfig('sanyus', 'activo'),
    'activo',
    'sanyus'
  );
  const sanyusGastos = await entitiesFor(
    getDocumentEntityConfig('sanyus', 'gasto'),
    'gasto',
    'sanyus'
  );
  const sanyusIngresos = await entitiesFor(
    getDocumentEntityConfig('sanyus', 'ingreso'),
    'ingreso',
    'sanyus'
  );

  return json({
    tree: {
      engine: {
        propiedades,
      },
      casa: {
        gastos: casaGastos,
        ingresos: casaIngresos,
        activos: casaActivos,
      },
      sanyus: {
        gastos: sanyusGastos,
        ingresos: sanyusIngresos,
        activos: sanyusActivos,
      },
    },
  });
}

export async function handleSearchDocuments(body: any) {
  ensureConfig();
  const q = (emptyOrNull(body.q) ?? '').toLowerCase();
  const bloqueFilter = emptyOrNull(body.bloque) as DocumentBloque | null;
  const entityTypeFilter = emptyOrNull(body.entityType) as DocumentEntityType | null;
  const entityIdFilter = emptyOrNull(body.entityId);

  const supabase = serviceSupabase();
  let query = supabase.from('documentos').select('*').order('created_at', { ascending: false });

  if (bloqueFilter && BLOQUES.has(bloqueFilter)) query = query.eq('bloque', bloqueFilter);
  if (entityTypeFilter && ENTITY_TYPES.has(entityTypeFilter)) {
    query = query.eq('entity_type', entityTypeFilter);
  }
  if (entityIdFilter) query = query.eq('entity_id', entityIdFilter);

  const { data: docs, error } = await query.limit(200);
  if (error) return json({ error: error.message }, 500);

  const filtered = (docs ?? []).filter((d) => {
    if (!q) return true;
    return d.display_name?.toLowerCase().includes(q);
  });

  const results: Array<Record<string, unknown>> = [];
  const labelCache = new Map<string, string>();

  for (const doc of filtered.slice(0, 100)) {
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

    const section =
      doc.bloque === 'engine'
        ? 'Engine'
        : doc.bloque === 'casa'
          ? 'Casa'
          : 'Sanyus';
    const typeLabel =
      doc.entity_type === 'propiedad'
        ? 'Propiedades'
        : doc.entity_type === 'activo'
          ? 'Activos'
          : doc.entity_type === 'gasto'
            ? 'Gastos'
            : 'Ingresos';

    results.push({
      ...doc,
      entity_label: entityLabel,
      entity_href: cfg.href(doc.entity_id),
      breadcrumb: `${section} / ${typeLabel} / ${entityLabel}`,
    });
  }

  return json({ results });
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
