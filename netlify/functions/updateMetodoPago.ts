import type { Handler } from '@netlify/functions';
import { handleUpdateMetodoPago, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateMetodoPago(body),
  'updateMetodoPago'
);
