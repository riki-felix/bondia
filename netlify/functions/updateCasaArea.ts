// netlify/functions/updateCasaArea.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateArea, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateArea('casa_areas', body),
  'updateCasaArea'
);
