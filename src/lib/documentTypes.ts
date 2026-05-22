// src/lib/documentTypes.ts

export type DocumentEntityType = "propiedad" | "activo" | "gasto" | "ingreso";
export type DocumentBloque = "engine" | "casa" | "sanyus";

export interface Documento {
  id: string;
  entity_type: DocumentEntityType;
  entity_id: string;
  bloque: DocumentBloque;
  storage_path: string;
  folder_slug: string;
  display_name: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  created_at: string;
}

export const DOCUMENT_BUCKET = "bondia-documentos";

export const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
]);

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_API = {
  list: "/.netlify/functions/listDocuments",
  upload: "/.netlify/functions/uploadDocument",
  reorder: "/.netlify/functions/reorderDocuments",
  delete: "/.netlify/functions/deleteDocument",
  signedUrl: "/.netlify/functions/getDocumentSignedUrl",
  tree: "/.netlify/functions/listDocumentsTree",
  search: "/.netlify/functions/searchDocuments",
} as const;

export interface DocumentTreeEntity {
  id: string;
  label: string;
  href: string;
  documentCount: number;
}

export interface DocumentTreeSection {
  key: string;
  label: string;
  entityType?: DocumentEntityType;
  entities: DocumentTreeEntity[];
  children?: DocumentTreeSection[];
}

export interface DocumentSearchResult extends Documento {
  entity_label: string;
  entity_href: string;
  breadcrumb: string;
}
