import type { Handler } from '@netlify/functions';
import { handleUpdateActivoTag, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateActivoTag(body),
  'updateActivoTag'
);
