// netlify/functions/deleteSettlement.ts
import type { Handler } from '@netlify/functions';
import { json } from './_shared';

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

  if (event.httpMethod !== 'POST') return json({ error: 'Method not allowed' }, 405);

  return json(
    {
      error:
        'La liquidación está vinculada a su inversión. Elimínala borrando la propiedad en Inversiones.',
    },
    403,
  );
};
