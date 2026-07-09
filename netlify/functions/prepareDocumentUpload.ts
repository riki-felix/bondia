import type { Handler } from '@netlify/functions';
import { handlePrepareDocumentUpload, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(
  handlePrepareDocumentUpload,
  'prepareDocumentUpload'
);
