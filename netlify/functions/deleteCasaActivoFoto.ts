import type { Handler } from '@netlify/functions';
import { handleDeleteActivoFoto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteActivoFoto('casa_activos_v2', body),
  'deleteCasaActivoFoto'
);
