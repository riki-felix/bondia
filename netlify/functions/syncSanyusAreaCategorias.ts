// netlify/functions/syncSanyusAreaCategorias.ts
import type { Handler } from '@netlify/functions';
import { handleSyncAreaCategorias, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleSyncAreaCategorias('sanyus_areas_categorias', body),
  'syncSanyusAreaCategorias'
);
