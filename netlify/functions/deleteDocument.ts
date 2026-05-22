import type { Handler } from '@netlify/functions';
import { handleDeleteDocument, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleDeleteDocument, 'deleteDocument');
