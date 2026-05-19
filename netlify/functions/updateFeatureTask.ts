import type { Handler } from '@netlify/functions';
import { handleUpdateFeatureTask, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleUpdateFeatureTask(body),
  'updateFeatureTask'
);
