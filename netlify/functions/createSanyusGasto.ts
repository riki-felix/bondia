// netlify/functions/createSanyusGasto.ts
import type { Handler } from '@netlify/functions';
import { handleCreateGasto, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateGasto('sanyus_gastos', body),
  'createSanyusGasto'
);
