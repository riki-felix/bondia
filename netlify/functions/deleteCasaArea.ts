// netlify/functions/deleteCasaArea.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteArea, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteArea('casa_areas', body),
  'deleteCasaArea'
);
