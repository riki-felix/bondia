// netlify/functions/createSanyusIngreso.ts
import type { Handler } from '@netlify/functions';
import { handleCreateIngreso, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateIngreso('sanyus_ingresos', body),
  'createSanyusIngreso'
);
