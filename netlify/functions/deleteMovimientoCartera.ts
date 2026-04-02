import type { Handler } from '@netlify/functions';
import { handleDeleteMovimientoCartera, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteMovimientoCartera(body),
  'deleteMovimientoCartera'
);
