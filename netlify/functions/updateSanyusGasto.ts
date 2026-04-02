// netlify/functions/updateSanyusGasto.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateGasto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateGasto('sanyus_gastos', body),
  'updateSanyusGasto'
);
