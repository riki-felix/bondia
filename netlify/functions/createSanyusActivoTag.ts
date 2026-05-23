import type { Handler } from '@netlify/functions';
import { handleCreateActivoTag, wrapHandler } from './_bloqueHandlers';

const CATALOG = 'sanyus_activos_tag_catalog';

export const handler: Handler = wrapHandler(
  (body) => handleCreateActivoTag(CATALOG, body),
  'createSanyusActivoTag'
);
