import type { Handler } from '@netlify/functions';
import { handleDeleteCaracteristica, wrapHandler } from './_bloqueHandlers';

const CATALOG = 'sanyus_activos_caracteristicas';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteCaracteristica(CATALOG, body),
  'deleteSanyusCaracteristica'
);
