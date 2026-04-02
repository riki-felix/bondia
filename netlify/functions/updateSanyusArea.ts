// netlify/functions/updateSanyusArea.ts
import type { Handler } from '@netlify/functions';
import { handleUpdateArea, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateArea('sanyus_areas', body),
  'updateSanyusArea'
);
