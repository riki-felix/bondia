// netlify/functions/deleteCasaActivo.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteActivo, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteActivo('casa_activos_v2', body),
  'deleteCasaActivo'
);
