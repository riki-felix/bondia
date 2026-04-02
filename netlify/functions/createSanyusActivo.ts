// netlify/functions/createSanyusActivo.ts
import type { Handler } from '@netlify/functions';
import { handleCreateActivo, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateActivo('sanyus_activos_v2', body),
  'createSanyusActivo'
);
