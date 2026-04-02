// netlify/functions/createCasaIngreso.ts
import type { Handler } from '@netlify/functions';
import { handleCreateIngreso, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateIngreso('casa_ingresos', body),
  'createCasaIngreso'
);
