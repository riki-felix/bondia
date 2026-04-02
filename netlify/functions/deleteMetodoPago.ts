import type { Handler } from '@netlify/functions';
import { handleDeleteMetodoPago, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteMetodoPago(body),
  'deleteMetodoPago'
);
