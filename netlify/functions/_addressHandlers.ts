import { json, parseBody } from './_shared';

/** Área metropolitana Barcelona / L'Hospitalet */
const BIAS_LAT = 41.36;
const BIAS_LON = 2.1;

const cache = new Map<string, { at: number; results: unknown[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60;

type PhotonFeature = {
  geometry: { coordinates: number[] };
  properties: Record<string, string>;
};

type AddressResult = {
  label: string;
  street?: string;
  housenumber?: string;
  city?: string;
  postcode?: string;
  lat?: number;
  lon?: number;
};

function titleCaseCatalanStreet(raw: string): string {
  const words = raw.toLowerCase().split(/\s+/).filter(Boolean);
  return words
    .map((w, i) => {
      if (w === 'deu') return 'Déu';
      if (w === 'de' || w === 'd') return i === 0 ? 'De' : 'de';
      if (['la', 'el', 'les', 'dels', 'l'].includes(w)) {
        return i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

function buildAddressSearchVariants(q: string): string[] {
  const trimmed = q.trim().replace(/\s+/g, ' ');
  if (!trimmed) return [];

  const variants = new Set<string>();
  variants.add(trimmed);

  const hasCity = trimmed.includes(',');
  if (!hasCity) {
    variants.add(`${trimmed}, Barcelona, España`);
    variants.add(`${trimmed}, L'Hospitalet de Llobregat, España`);
  }

  const isCatastroLike =
    trimmed === trimmed.toUpperCase() &&
    /[A-Z]/.test(trimmed) &&
    !/^(CARRER|AVINGUDA|AV\.|PLAÇA|PASSEIG|CAMÍ|C\/)/i.test(trimmed);

  if (isCatastroLike) {
    const titled = titleCaseCatalanStreet(trimmed);
    variants.add(`Carrer de la ${titled}, Barcelona, España`);
    variants.add(`Carrer ${titled}, Barcelona, España`);
    variants.add(`${titled}, Barcelona, España`);
  }

  return [...variants];
}

function formatPhotonProperties(props: Record<string, string | undefined>): string {
  const parts: string[] = [];

  if (props.street) {
    const line = props.housenumber
      ? `${props.street}, ${props.housenumber}`
      : props.street;
    parts.push(line);
  } else if (props.name) {
    parts.push(props.name);
  }

  const city = props.city || props.locality || props.town || props.municipality;
  if (city) parts.push(city);

  return parts.join(', ');
}

function featureScore(props: Record<string, string>): number {
  if (props.type === 'street') return 100;
  if (props.osm_value === 'residential' || props.osm_value === 'living_street') return 90;
  if (props.street && props.osm_key === 'highway') return 70;
  if (props.street) return 40;
  return 10;
}

function dedupeKey(item: AddressResult): string {
  const street = (item.street || item.label.split(',')[0] || '').trim().toLowerCase();
  const city = (item.city || '').trim().toLowerCase();
  return `${street}|${city}`;
}

function mapFeature(f: PhotonFeature): AddressResult | null {
  const props = f.properties ?? {};
  const label = formatPhotonProperties(props);
  if (!label) return null;
  const [lon, lat] = f.geometry?.coordinates ?? [];
  return {
    label,
    street: props.street,
    housenumber: props.housenumber,
    city: props.city || props.locality || props.town,
    postcode: props.postcode,
    lat: Number.isFinite(lat) ? lat : undefined,
    lon: Number.isFinite(lon) ? lon : undefined,
  };
}

async function fetchPhoton(q: string, limit: number) {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', q);
  url.searchParams.set('lang', 'default');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('lat', String(BIAS_LAT));
  url.searchParams.set('lon', String(BIAS_LON));

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Photon error ${res.status}`);
  }
  return res.json() as Promise<{ features?: PhotonFeature[] }>;
}

async function searchPhotonRanked(queries: string[], limit: number): Promise<AddressResult[]> {
  const seen = new Set<string>();
  const ranked: { score: number; item: AddressResult }[] = [];

  for (const q of queries) {
    const data = await fetchPhoton(q, limit);
    for (const f of data.features ?? []) {
      const item = mapFeature(f);
      if (!item) continue;
      const key = dedupeKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      ranked.push({ score: featureScore(f.properties ?? {}), item });
    }
    if (ranked.length >= limit) break;
  }

  return ranked
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}

export async function handleSearchAddress(body: { q?: string; limit?: number }) {
  const q = (body.q ?? '').trim();
  if (q.length < 3) {
    return json({ results: [] });
  }

  const limit = Math.min(Math.max(Number(body.limit) || 6, 1), 10);
  const queries = buildAddressSearchVariants(q);
  const cacheKey = `${queries.join('||').toLowerCase()}|${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return json({ results: cached.results });
  }

  const results = await searchPhotonRanked(queries, limit);

  cache.set(cacheKey, { at: Date.now(), results });
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

export function wrapAddressHandler(
  handler: (body: Record<string, unknown>) => Promise<{ statusCode: number; body: string }>,
  label: string
) {
  return async (event: { httpMethod?: string; body?: string | null }) => {
    if (event.httpMethod === 'OPTIONS') return corsPreflightResponse();
    if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

    try {
      const body = parseBody(event.body) as Record<string, unknown>;
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
