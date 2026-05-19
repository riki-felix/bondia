import type { Handler } from '@netlify/functions';
import { handleDeleteFeatureTask, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleDeleteFeatureTask(body),
  'deleteFeatureTask'
);
