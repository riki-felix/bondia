// netlify/functions/updateCasaActivo.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateActivo, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateActivo('casa_activos_v2', body),
  'updateCasaActivo'
);
