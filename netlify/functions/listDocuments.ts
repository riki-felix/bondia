import type { Handler } from '@netlify/functions';
import { handleListDocuments, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(handleListDocuments, 'listDocuments');
