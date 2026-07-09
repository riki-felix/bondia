import type { Handler } from '@netlify/functions';
import { handleFinalizeDocumentUpload, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(
  handleFinalizeDocumentUpload,
  'finalizeDocumentUpload'
);
