// netlify/functions/deleteCasaGasto.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteGasto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteGasto('casa_gastos', body),
  'deleteCasaGasto'
);
