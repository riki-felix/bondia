// netlify/functions/deleteCasaIngreso.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteIngreso, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteIngreso('casa_ingresos', body),
  'deleteCasaIngreso'
);
