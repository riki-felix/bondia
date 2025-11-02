// netlify/functions/icgc-autocomplete.ts
import type { Handler } from '@netlify/functions';

// ICGC endpoint recomendado para sugerencias
const BASE = 'https://eines.icgc.cat/geocodificador/autocompletar';

export const handler: Handler = async (event) => {
  try {
	if (event.httpMethod === 'OPTIONS') {
	  return { statusCode: 204, headers: cors(), body: '' };
	}
	if (event.httpMethod !== 'GET') {
	  return json({ error: 'Method not allowed' }, 405);
	}

	const text = event.queryStringParameters?.text?.trim() || '';
	const size = event.queryStringParameters?.size || '8';
	const layers = event.queryStringParameters?.layers || 'address';

	if (text.length < 3) {
	  return json({ features: [] }); // vacío si query corta
	}

	const url = `${BASE}?text=${encodeURIComponent(text)}&size=${encodeURIComponent(size)}&layers=${encodeURIComponent(layers)}`;

	const res = await fetch(url, {
	  headers: { 'Accept': 'application/geo+json, application/json' },
	});

	if (!res.ok) {
	  return json({ error: `ICGC ${res.status}` }, res.status);
	}

	const geo = await res.json();

	// Normalizamos a un array simple de sugerencias
	const features = Array.isArray(geo?.features) ? geo.features : [];
	const suggestions = features.map((f: any) => {
	  const p = f?.properties || {};
	  const g = f?.geometry;

	  const via   = p.nom_via || p.nom || '';
	  const tVia  = p.tipus_via_a || p.tipus_via || '';
	  const nexe  = p.nexe_via || '';
	  const portal= p.portal || '';
	  const muni  = p.municipi || '';
	  const cp    = p.codi_postal || '';
	  const etiqueta = p.etiqueta || '';

	  const viaLabel = [tVia, nexe, via].filter(Boolean).join(' ').trim();
	  const display  = etiqueta || `${viaLabel} ${portal}, ${cp} ${muni}`.trim();

	  const coords = Array.isArray(g?.coordinates) && g.coordinates.length === 2
		? { lon: g.coordinates[0], lat: g.coordinates[1] }
		: { lon: null, lat: null };

	  return {
		display,
		via: viaLabel,
		numero: portal,
		municipio: muni,
		cp,
		provincia: '', // ICGC no la expone directamente
		...coords,
	  };
	});

	return json({ suggestions });

  } catch (e: any) {
	console.error('[icgc-autocomplete] fatal:', e);
	return json({ error: e.message || 'Unexpected error' }, 500);
  }
};

function json(payload: any, statusCode = 200) {
  return { statusCode, headers: cors(), body: JSON.stringify(payload) };
}
function cors() {
  return {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Content-Type': 'application/json; charset=utf-8',
  };
}