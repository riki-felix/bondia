// netlify/functions/upsertCasaOverride.ts
import type { Handler } from '@netlify/functions';
import { wrapHandler, handleUpsertOverride } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpsertOverride('casa_gastos_overrides', 'casa_ingresos_overrides', body),
  'upsertCasaOverride'
);
