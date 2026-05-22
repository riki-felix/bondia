import type { Handler } from '@netlify/functions';
import { handleSearchDocuments, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleSearchDocuments, 'searchDocuments');
