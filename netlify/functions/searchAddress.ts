import type { Handler } from '@netlify/functions';
import { handleSearchAddress, wrapAddressHandler } from './_addressHandlers';

export const handler: Handler = wrapAddressHandler(
  (body) => handleSearchAddress(body as { q?: string; limit?: number }),
  'searchAddress'
);
