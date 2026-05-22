import type { Handler } from '@netlify/functions';
import { handleListDocumentsTree, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(
  () => handleListDocumentsTree(),
  'listDocumentsTree'
);
