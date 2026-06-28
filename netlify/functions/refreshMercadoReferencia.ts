import type { Handler } from '@netlify/functions';
import { json } from './_shared';
import { refreshMercadoReferencia } from './_mercadoReferencia';

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
    const result = await refreshMercadoReferencia();
    return json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error al actualizar referencias de mercado';
    console.error('[refreshMercadoReferencia]', e);
    return json({ error: msg }, 500);
  }
};
