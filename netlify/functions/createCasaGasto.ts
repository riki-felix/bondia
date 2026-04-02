// netlify/functions/createCasaGasto.ts
import type { Handler } from '@netlify/functions';
import { handleCreateGasto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateGasto('casa_gastos', body),
  'createCasaGasto'
);
