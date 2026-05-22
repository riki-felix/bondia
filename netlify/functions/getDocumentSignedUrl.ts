import type { Handler } from '@netlify/functions';
import { handleGetDocumentSignedUrl, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleGetDocumentSignedUrl, 'getDocumentSignedUrl');
