// netlify/functions/upsertSanyusOverride.ts
import type { Handler } from '@netlify/functions';
import { wrapHandler, handleUpsertOverride } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpsertOverride('sanyus_gastos_overrides', 'sanyus_ingresos_overrides', body),
  'upsertSanyusOverride'
);
