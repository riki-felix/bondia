import type { Handler } from '@netlify/functions';
import { handleCreateCaracteristica, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateCaracteristica(body),
  'createCaracteristica'
);
