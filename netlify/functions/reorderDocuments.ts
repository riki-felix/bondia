import type { Handler } from '@netlify/functions';
import { handleReorderDocuments, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleReorderDocuments, 'reorderDocuments');
