import type { Handler } from '@netlify/functions';
import { handleCreateActivoTag, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateActivoTag(body),
  'createActivoTag'
);
