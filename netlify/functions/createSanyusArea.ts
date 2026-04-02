// netlify/functions/createSanyusArea.ts
import type { Handler } from '@netlify/functions';
import { handleCreateArea, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateArea('sanyus_areas', body),
  'createSanyusArea'
);
