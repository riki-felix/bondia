import { serviceSupabase } from './_shared';

const VALOR_TASADO_ESPANA_URL =
  'https://datos.comunidad.madrid/dataset/f1f32f00-b000-4546-87ed-316f066f19b5/resource/bacca0cf-23ab-43fd-b734-f0985f1fb61f/download/valor-tasado-de-la-vivienda-base-2005.json';

const CONCEPTO_VIVIENDA_LIBRE = 'Valor tasado de la vivienda libre';

export interface MercadoReferenciaItem {
  slug: string;
  fuente: 'mitma' | 'idealista';
  territorioKey: string;
  etiqueta: string;
  euroM2: number;
  periodo: string;
  updatedAt: string;
}

export interface MercadoReferenciaBundle {
  mitma: {
    espana: MercadoReferenciaItem | null;
    provincias: Record<string, MercadoReferenciaItem>;
  };
  idealista: {
    provincias: Record<string, MercadoReferenciaItem>;
  };
  updatedAt: string | null;
}

type DbRow = {
  slug: string;
  fuente: 'mitma' | 'idealista';
  territorio_key: string;
  etiqueta: string;
  euro_m2: number;
  periodo: string;
  updated_at: string;
};

function mapRow(row: DbRow): MercadoReferenciaItem {
  return {
    slug: row.slug,
    fuente: row.fuente,
    territorioKey: row.territorio_key,
    etiqueta: row.etiqueta,
    euroM2: Number(row.euro_m2),
    periodo: row.periodo,
    updatedAt: row.updated_at,
  };
}

export function bundleFromRows(rows: DbRow[]): MercadoReferenciaBundle {
  const mitmaProvincias: Record<string, MercadoReferenciaItem> = {};
  const idealistaProvincias: Record<string, MercadoReferenciaItem> = {};
  let mitmaEspana: MercadoReferenciaItem | null = null;
  let updatedAt: string | null = null;

  for (const row of rows) {
    const item = mapRow(row);
    if (!updatedAt || new Date(item.updatedAt).getTime() > new Date(updatedAt).getTime()) {
      updatedAt = item.updatedAt;
    }

    if (row.fuente === 'mitma') {
      if (row.territorio_key === 'ESPANA') mitmaEspana = item;
      else mitmaProvincias[row.territorio_key] = item;
    } else {
      idealistaProvincias[row.territorio_key] = item;
    }
  }

  return {
    mitma: { espana: mitmaEspana, provincias: mitmaProvincias },
    idealista: { provincias: idealistaProvincias },
    updatedAt,
  };
}

export async function loadMercadoReferenciaFromDb(): Promise<MercadoReferenciaBundle> {
  const supabase = serviceSupabase();
  const { data, error } = await supabase
    .from('bondia_mercado_referencia')
    .select('slug, fuente, territorio_key, etiqueta, euro_m2, periodo, updated_at');

  if (error) throw new Error(error.message);
  return bundleFromRows((data ?? []) as DbRow[]);
}

async function upsertMercadoRow(
  slug: string,
  fuente: 'mitma' | 'idealista',
  territorioKey: string,
  etiqueta: string,
  euroM2: number,
  periodo: string
) {
  const supabase = serviceSupabase();
  const now = new Date().toISOString();
  const { error } = await supabase.from('bondia_mercado_referencia').upsert(
    {
      slug,
      fuente,
      territorio_key: territorioKey,
      etiqueta,
      euro_m2: euroM2,
      periodo,
      updated_at: now,
    },
    { onConflict: 'slug' }
  );
  if (error) throw new Error(error.message);
}

async function fetchMitmaEspanaAnual(): Promise<{ euroM2: number; periodo: string } | null> {
  const res = await fetch(VALOR_TASADO_ESPANA_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: Array<{ Año?: string; Concepto?: string; Valor?: string; Unidad?: string }>;
  };

  const rows =
    json.data?.filter(
      (r) =>
        r.Concepto === CONCEPTO_VIVIENDA_LIBRE &&
        r.Unidad === 'Euros/m2' &&
        r.Valor &&
        r.Valor !== '-'
    ) ?? [];

  if (!rows.length) return null;

  const latest = rows.reduce((best, row) => {
    const year = Number(row.Año);
    if (!Number.isFinite(year)) return best;
    if (!best || year > Number(best.Año)) return row;
    return best;
  }, rows[0]);

  const euroM2 = Number(String(latest.Valor).replace(',', '.'));
  if (!Number.isFinite(euroM2) || euroM2 <= 0) return null;

  return { euroM2, periodo: String(latest.Año) };
}

function readIdealistaFromEnv(): Array<{
  territorioKey: string;
  etiqueta: string;
  euroM2: number;
  periodo: string;
}> {
  const updates: Array<{
    territorioKey: string;
    etiqueta: string;
    euroM2: number;
    periodo: string;
  }> = [];

  const entries = [
    { key: 'BARCELONA', etiqueta: 'Barcelona (prov.)', m2: process.env.IDEALISTA_BARCELONA_M2, periodo: process.env.IDEALISTA_BARCELONA_PERIODO },
    { key: 'MADRID', etiqueta: 'Madrid (CA)', m2: process.env.IDEALISTA_MADRID_M2, periodo: process.env.IDEALISTA_MADRID_PERIODO },
  ];

  for (const entry of entries) {
    if (!entry.m2?.trim() || !entry.periodo?.trim()) continue;
    const euroM2 = Number(entry.m2.replace(',', '.'));
    if (!Number.isFinite(euroM2) || euroM2 <= 0) continue;
    updates.push({
      territorioKey: entry.key,
      etiqueta: entry.etiqueta,
      euroM2,
      periodo: entry.periodo.trim(),
    });
  }

  return updates;
}

export async function refreshMercadoReferencia(): Promise<{
  bundle: MercadoReferenciaBundle;
  mitmaUpdated: boolean;
  idealistaUpdated: boolean;
  idealistaNote: string | null;
}> {
  let mitmaUpdated = false;
  let idealistaUpdated = false;
  let idealistaNote: string | null = null;

  const mitmaEspana = await fetchMitmaEspanaAnual();
  if (mitmaEspana) {
    await upsertMercadoRow(
      'mitma:espana',
      'mitma',
      'ESPANA',
      'España',
      mitmaEspana.euroM2,
      mitmaEspana.periodo
    );
    mitmaUpdated = true;
  }

  const idealistaEnv = readIdealistaFromEnv();
  if (idealistaEnv.length) {
    for (const item of idealistaEnv) {
      await upsertMercadoRow(
        `idealista:${item.territorioKey}`,
        'idealista',
        item.territorioKey,
        item.etiqueta,
        item.euroM2,
        item.periodo
      );
    }
    idealistaUpdated = true;
  } else {
    idealistaNote =
      'Idealista bloquea la lectura automática; se mantienen los valores en caché. Configura IDEALISTA_*_M2 en Netlify o actualiza la tabla.';
  }

  const bundle = await loadMercadoReferenciaFromDb();
  return { bundle, mitmaUpdated, idealistaUpdated, idealistaNote };
}
