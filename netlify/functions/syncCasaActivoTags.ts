import type { Handler } from '@netlify/functions';
import { handleSyncActivoTags, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleSyncActivoTags('casa_activos_tags', body),
  'syncCasaActivoTags'
);
