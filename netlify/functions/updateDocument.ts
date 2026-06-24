import type { Handler } from '@netlify/functions';
import { handleUpdateDocument, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleUpdateDocument, 'updateDocument');
