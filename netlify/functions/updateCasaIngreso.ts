// netlify/functions/updateCasaIngreso.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateIngreso, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateIngreso('casa_ingresos', body),
  'updateCasaIngreso'
);
