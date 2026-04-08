import type { Handler } from '@netlify/functions';
import { handleDeleteActivoTag, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteActivoTag(body),
  'deleteActivoTag'
);
