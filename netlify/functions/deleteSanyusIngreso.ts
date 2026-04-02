// netlify/functions/deleteSanyusIngreso.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteIngreso, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteIngreso('sanyus_ingresos', body),
  'deleteSanyusIngreso'
);
