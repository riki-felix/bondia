import type { Handler } from '@netlify/functions';
import { handleCreateMovimientoCartera, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateMovimientoCartera(body),
  'createMovimientoCartera'
);
