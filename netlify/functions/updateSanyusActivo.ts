// netlify/functions/updateSanyusActivo.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateActivo, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateActivo('sanyus_activos_v2', body),
  'updateSanyusActivo'
);
