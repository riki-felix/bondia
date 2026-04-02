// netlify/functions/createCasaArea.ts
import type { Handler } from '@netlify/functions';
import { handleCreateArea, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateArea('casa_areas', body),
  'createCasaArea'
);
