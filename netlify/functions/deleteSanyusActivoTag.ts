import type { Handler } from '@netlify/functions';
import { handleDeleteActivoTag, wrapHandler } from './_bloqueHandlers';

const CATALOG = 'sanyus_activos_tag_catalog';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteActivoTag(CATALOG, body),
  'deleteSanyusActivoTag'
);
