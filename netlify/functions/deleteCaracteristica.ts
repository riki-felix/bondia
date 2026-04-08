import type { Handler } from '@netlify/functions';
import { handleDeleteCaracteristica, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteCaracteristica(body),
  'deleteCaracteristica'
);
