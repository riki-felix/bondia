import type { Handler } from '@netlify/functions';
import { handleUploadDocument, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleUploadDocument, 'uploadDocument');
