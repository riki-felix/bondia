import type { Handler } from '@netlify/functions';
import { handleUpdateCaracteristica, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateCaracteristica(body),
  'updateCaracteristica'
);
