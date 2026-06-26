import { json, parseBody } from './_shared';

/** Área metropolitana Barcelona / L'Hospitalet */
const BIAS_LAT = 41.36;
const BIAS_LON = 2.1;

const cache = new Map<string, { at: number; results: unknown[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60;

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
  return res.json() as Promise<{ features?: Array<{ geometry: { coordinates: number[] }; properties: Record<string, string> }> }>;
}

function mapFeatures(features: Array<{ geometry: { coordinates: number[] }; properties: Record<string, string> }>) {
  return features
    .map((f) => {
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
    })
    .filter((x): x is NonNullable<typeof x> => x != null);
}

export async function handleSearchAddress(body: { q?: string; limit?: number }) {
  const q = (body.q ?? '').trim();
  if (q.length < 3) {
    return json({ results: [] });
  }

  const limit = Math.min(Math.max(Number(body.limit) || 6, 1), 10);
  const cacheKey = `${q.toLowerCase()}|${limit}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return json({ results: cached.results });
  }

  const data = await fetchPhoton(q, limit);
  const results = mapFeatures(data.features ?? []);

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
