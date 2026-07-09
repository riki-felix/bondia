// src/lib/documentApi.ts
import {
  DOCUMENT_API,
  MAX_DOCUMENT_UPLOAD_BYTES,
  type Documento,
  type DocumentBloque,
  type DocumentEntityType,
  type DocumentSearchResult,
  type DocumentExplorerSearchResponse,
  type DocumentEntityListItem,
  type DocumentEntitySort,
  type DocumentTreeSectionSummary,
  type DocumentCategoriaOption,
  ESCRITURA_FOLDER_SLUG,
  MASTER_LIQUIDACION_FOLDER_SLUG,
} from "./documentTypes";

export { ESCRITURA_FOLDER_SLUG, MASTER_LIQUIDACION_FOLDER_SLUG, MAX_DOCUMENT_UPLOAD_BYTES };

export interface ListDocumentsOptions {
  folderSlug?: string;
  excludeFolderSlug?: string;
}

export interface UploadDocumentOptions {
  displayName?: string;
  folderSlug?: string;
}

interface PrepareDocumentUploadResponse {
  documentId: string;
  storage_path: string;
  signedUrl: string;
  token: string;
  sort_order: number;
  folder_slug: string;
  display_name: string;
  mime_type: string;
}

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }
  return data as T;
}

export async function listDocuments(
  bloque: DocumentBloque,
  entityType: DocumentEntityType,
  entityId: string,
  options?: ListDocumentsOptions
): Promise<Documento[]> {
  const data = await postJson<{ documents: Documento[] }>(DOCUMENT_API.list, {
    bloque,
    entityType,
    entityId,
    folderSlug: options?.folderSlug,
    excludeFolderSlug: options?.excludeFolderSlug,
  });
  return data.documents ?? [];
}

export async function uploadDocument(
  bloque: DocumentBloque,
  entityType: DocumentEntityType,
  entityId: string,
  file: File,
  options?: UploadDocumentOptions
): Promise<Documento> {
  if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
    throw new Error(
      `El archivo supera el límite de ${Math.round(MAX_DOCUMENT_UPLOAD_BYTES / (1024 * 1024))} MB`
    );
  }

  const mimeType = file.type || "application/octet-stream";
  const displayName = options?.displayName?.trim() || file.name;

  const prep = await postJson<PrepareDocumentUploadResponse>(
    DOCUMENT_API.prepareUpload,
    {
      bloque,
      entityType,
      entityId,
      mimeType,
      displayName,
      folderSlug: options?.folderSlug,
      sizeBytes: file.size,
    }
  );

  const putRes = await fetch(prep.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType },
    body: file,
  });

  if (!putRes.ok) {
    const errText = await putRes.text().catch(() => "");
    throw new Error(
      errText.trim() || `Error al subir el archivo (${putRes.status})`
    );
  }

  return postJson<Documento>(DOCUMENT_API.finalizeUpload, {
    documentId: prep.documentId,
    bloque,
    entityType,
    entityId,
    storage_path: prep.storage_path,
    folderSlug: prep.folder_slug,
    displayName,
    mimeType,
    sizeBytes: file.size,
    sort_order: prep.sort_order,
  });
}

export async function updateDocumentDisplayName(
  id: string,
  displayName: string
): Promise<Documento> {
  const trimmed = displayName.trim();
  if (!trimmed) throw new Error("El título no puede estar vacío");
  return postJson<Documento>(DOCUMENT_API.update, { id, displayName: trimmed });
}

export async function reorderDocuments(
  items: { id: string; sort_order: number }[]
): Promise<void> {
  await postJson(DOCUMENT_API.reorder, { items });
}

export async function deleteDocument(id: string): Promise<void> {
  await postJson(DOCUMENT_API.delete, { id });
}

export async function getDocumentSignedUrl(id: string): Promise<{
  url: string;
  mime_type: string;
  display_name: string;
}> {
  return postJson(DOCUMENT_API.signedUrl, { id });
}

export interface DocumentTreeProperty {
  id: string;
  label: string;
  href: string;
  documentCount: number;
}

export async function fetchDocumentsTree(): Promise<{
  tree: {
    engine: { propiedades: DocumentTreeProperty[] };
    casa: {
      gastos: DocumentTreeSectionSummary;
      ingresos: DocumentTreeSectionSummary;
      activos: DocumentTreeSectionSummary;
    };
    sanyus: {
      gastos: DocumentTreeSectionSummary;
      ingresos: DocumentTreeSectionSummary;
      activos: DocumentTreeSectionSummary;
    };
  };
}> {
  return postJson(DOCUMENT_API.tree, {});
}

export async function listDocumentEntities(params: {
  bloque: DocumentBloque;
  entityType: DocumentEntityType;
  q?: string;
  ejercicio?: number | "all";
  categoriaId?: string;
  hasDocuments?: boolean;
  sort?: DocumentEntitySort;
}): Promise<DocumentEntityListItem[]> {
  const data = await postJson<{ entities: DocumentEntityListItem[] }>(
    DOCUMENT_API.listEntities,
    {
      bloque: params.bloque,
      entityType: params.entityType,
      q: params.q?.trim() || undefined,
      ejercicio: params.ejercicio,
      categoriaId: params.categoriaId,
      hasDocuments: params.hasDocuments,
      sort: params.sort ?? "created_desc",
    }
  );
  return data.entities ?? [];
}

export async function listDocumentEntityCategories(
  bloque: DocumentBloque,
  entityType: DocumentEntityType
): Promise<DocumentCategoriaOption[]> {
  const data = await postJson<{ categories: DocumentCategoriaOption[] }>(
    DOCUMENT_API.listCategories,
    { bloque, entityType }
  );
  return data.categories ?? [];
}

export async function searchDocuments(params: {
  q?: string;
  bloque?: DocumentBloque;
  entityType?: DocumentEntityType;
  entityId?: string;
}): Promise<DocumentExplorerSearchResponse> {
  const data = await postJson<DocumentExplorerSearchResponse>(
    DOCUMENT_API.search,
    params
  );
  return {
    entities: data.entities ?? [],
    files: data.files ?? [],
  };
}
