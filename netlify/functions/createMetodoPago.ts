import type { Handler } from '@netlify/functions';
import { handleCreateMetodoPago, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateMetodoPago(body),
  'createMetodoPago'
);
