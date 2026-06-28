import type { Handler } from '@netlify/functions';
import { json, parseBody } from './_shared';
import { fetchCatastroByReferencia } from './_catastroConsulta';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
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

  if (event.httpMethod !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = parseBody(event.body) as { referencia?: string };
    const referencia = (body.referencia ?? '').trim();
    if (!referencia) {
      return json({ error: 'Indica una referencia catastral' }, 400);
    }

    const result = await fetchCatastroByReferencia(referencia);
    return json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al validar la referencia catastral';
    console.error('[validateCatastro]', e);
    return json({ error: msg }, 404);
  }
};
