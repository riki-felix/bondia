import type { Handler } from '@netlify/functions';
import { handleSyncCaracteristicaValores, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleSyncCaracteristicaValores('casa_activos_caracteristica_valores', body),
  'syncCasaCaracteristicaValores'
);
