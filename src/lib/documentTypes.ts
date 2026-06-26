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

/** Carpeta única en storage para documentos de escritura de inmuebles */
export const ESCRITURA_FOLDER_SLUG = "escritura";

/** Un solo PDF master de liquidación por propiedad */
export const MASTER_LIQUIDACION_FOLDER_SLUG = "master-liquidacion";

export interface PendingTitledDocument {
  file: File;
  title: string;
}

/** @deprecated Usar PendingTitledDocument */
export type PendingEscrituraDocument = PendingTitledDocument;

export const DOCUMENT_API = {
  list: "/.netlify/functions/listDocuments",
  upload: "/.netlify/functions/uploadDocument",
  update: "/.netlify/functions/updateDocument",
  reorder: "/.netlify/functions/reorderDocuments",
  delete: "/.netlify/functions/deleteDocument",
  signedUrl: "/.netlify/functions/getDocumentSignedUrl",
  tree: "/.netlify/functions/listDocumentsTree",
  search: "/.netlify/functions/searchDocuments",
  listEntities: "/.netlify/functions/listDocumentEntities",
  listCategories: "/.netlify/functions/listDocumentEntityCategories",
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

export interface DocumentEntitySearchResult {
  id: string;
  label: string;
  href: string;
  bloque: DocumentBloque;
  entity_type: DocumentEntityType;
  breadcrumb: string;
  documentCount: number;
}

export interface DocumentExplorerSearchResponse {
  entities: DocumentEntitySearchResult[];
  files: DocumentSearchResult[];
}

export interface DocumentTreeSectionSummary {
  entityCount: number;
  documentCount: number;
}

export interface DocumentEntityListItem {
  id: string;
  label: string;
  href: string;
  created_at: string;
  documentCount: number;
  ejercicio?: number | null;
  categoria_id?: string | null;
  categoria_nombre?: string | null;
}

export interface DocumentCategoriaOption {
  id: string;
  nombre: string;
}

export type DocumentEntitySort =
  | "created_desc"
  | "created_asc"
  | "name_asc"
  | "name_desc";
