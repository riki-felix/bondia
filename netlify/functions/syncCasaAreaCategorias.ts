// netlify/functions/syncCasaAreaCategorias.ts
import type { Handler } from '@netlify/functions';
import { handleSyncAreaCategorias, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleSyncAreaCategorias('casa_areas_categorias', body),
  'syncCasaAreaCategorias'
);
