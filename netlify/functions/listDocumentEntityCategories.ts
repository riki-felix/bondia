import type { Handler } from '@netlify/functions';
import { handleListDocumentEntityCategories, wrapDocumentHandler } from './_documentHandlers';

export const handler: Handler = wrapDocumentHandler(
  handleListDocumentEntityCategories,
  'listDocumentEntityCategories'
);
