// netlify/functions/createCasaActivo.ts
import type { Handler } from '@netlify/functions';
import { handleCreateActivo, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateActivo('casa_activos_v2', body),
  'createCasaActivo'
);
