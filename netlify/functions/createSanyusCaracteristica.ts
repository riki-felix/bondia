import type { Handler } from '@netlify/functions';
import { handleCreateCaracteristica, wrapHandler } from './_bloqueHandlers';

const CATALOG = 'sanyus_activos_caracteristicas';

export const handler: Handler = wrapHandler(
  (body) => handleCreateCaracteristica(CATALOG, body),
  'createSanyusCaracteristica'
);
