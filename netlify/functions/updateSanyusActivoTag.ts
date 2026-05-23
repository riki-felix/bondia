import type { Handler } from '@netlify/functions';
import { handleUpdateActivoTag, wrapHandler } from './_bloqueHandlers';

const CATALOG = 'sanyus_activos_tag_catalog';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateActivoTag(CATALOG, body),
  'updateSanyusActivoTag'
);
