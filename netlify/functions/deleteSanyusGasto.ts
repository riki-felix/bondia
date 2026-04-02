// netlify/functions/deleteSanyusGasto.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteGasto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteGasto('sanyus_gastos', body),
  'deleteSanyusGasto'
);
