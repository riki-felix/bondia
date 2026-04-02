// netlify/functions/deleteSanyusArea.ts
import type { Handler } from '@netlify/functions';
import { handleDeleteArea, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteArea('sanyus_areas', body),
  'deleteSanyusArea'
);
