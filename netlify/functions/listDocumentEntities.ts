import type { Handler } from '@netlify/functions';
import { handleListDocumentEntities, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(
  handleListDocumentEntities,
  'listDocumentEntities'
);
