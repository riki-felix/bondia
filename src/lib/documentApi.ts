// src/lib/documentApi.ts
import {
  DOCUMENT_API,
  ALLOWED_DOCUMENT_MIMES,
  MAX_DOCUMENT_BYTES,
  type Documento,
  type DocumentBloque,
  type DocumentEntityType,
  type DocumentSearchResult,
} from "./documentTypes";

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
  entityId: string
): Promise<Documento[]> {
  const data = await postJson<{ documents: Documento[] }>(DOCUMENT_API.list, {
    bloque,
    entityType,
    entityId,
  });
  return data.documents ?? [];
}

export async function uploadDocument(
  bloque: DocumentBloque,
  entityType: DocumentEntityType,
  entityId: string,
  file: File
): Promise<Documento> {
  if (!ALLOWED_DOCUMENT_MIMES.has(file.type) && !file.name.match(/\.(pdf|jpe?g)$/i)) {
    throw new Error("Solo se permiten PDF o JPG");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Archivo demasiado grande (máx 10 MB)");
  }
  const base64 = await fileToBase64(file);
  const mimeType =
    file.type ||
    (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg");
  return postJson<Documento>(DOCUMENT_API.upload, {
    bloque,
    entityType,
    entityId,
    base64,
    mimeType,
    displayName: file.name,
  });
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

export async function fetchDocumentsTree(): Promise<{
  tree: {
    engine: { propiedades: Array<{ id: string; label: string; href: string; documentCount: number }> };
    casa: {
      gastos: Array<{ id: string; label: string; href: string; documentCount: number }>;
      ingresos: Array<{ id: string; label: string; href: string; documentCount: number }>;
      activos: Array<{ id: string; label: string; href: string; documentCount: number }>;
    };
    sanyus: {
      gastos: Array<{ id: string; label: string; href: string; documentCount: number }>;
      ingresos: Array<{ id: string; label: string; href: string; documentCount: number }>;
      activos: Array<{ id: string; label: string; href: string; documentCount: number }>;
    };
  };
}> {
  return postJson(DOCUMENT_API.tree, {});
}

export async function searchDocuments(params: {
  q?: string;
  bloque?: DocumentBloque;
  entityType?: DocumentEntityType;
  entityId?: string;
}): Promise<DocumentSearchResult[]> {
  const data = await postJson<{ results: DocumentSearchResult[] }>(
    DOCUMENT_API.search,
    params
  );
  return data.results ?? [];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}
