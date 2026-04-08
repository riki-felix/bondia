import type { Handler } from '@netlify/functions';
import { handleUploadActivoFoto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUploadActivoFoto('casa_activos_v2', body),
  'uploadCasaActivoFoto'
);
