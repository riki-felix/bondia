import type { Handler } from '@netlify/functions';
import { handleCreateFeatureTask, wrapHandler } from './_bloqueHandlers';

export const handler: Handler = wrapHandler(
  (body) => handleCreateFeatureTask(body),
  'createFeatureTask'
);
