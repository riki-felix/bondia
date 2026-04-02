// netlify/functions/updateSanyusIngreso.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateIngreso, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateIngreso('sanyus_ingresos', body),
  'updateSanyusIngreso'
);
