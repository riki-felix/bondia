import type { Handler } from '@netlify/functions';
import { handleUpdateCaracteristica, wrapHandler } from './_bloqueHandlers';

const CATALOG = 'sanyus_activos_caracteristicas';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateCaracteristica(CATALOG, body),
  'updateSanyusCaracteristica'
);
