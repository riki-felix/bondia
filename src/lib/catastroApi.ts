export interface CatastroValidationResult {
  referenciaCatastral: string;
  superficieConstruidaM2: number;
  superficieViviendaM2: number | null;
  anioConstruccion: number | null;
  uso: string | null;
  direccionCatastro: string | null;
}

export function normalizeReferenciaCatastral(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

/** Referencia de parcela (14 chars) para foto de fachada del edificio. */
export function parcelReferenciaFromRef(referencia: string): string | null {
  const ref = normalizeReferenciaCatastral(referencia);
  if (!ref || ref.length < 14) return null;
  return ref.slice(0, 14);
}

export function isCatastroReferenciaValidada(
  referencia: string,
  validadaReferencia: string | null | undefined,
  validadoAt: string | null | undefined
): boolean {
  if (!validadoAt || !validadaReferencia?.trim()) return false;
  const current = normalizeReferenciaCatastral(referencia);
  if (!current) return false;
  return current === normalizeReferenciaCatastral(validadaReferencia);
}

export function catastroFachadaPreviewUrl(referencia: string): string | null {
  const parcel = parcelReferenciaFromRef(referencia);
  if (!parcel) return null;
  return `/.netlify/functions/catastroFachada?referencia=${encodeURIComponent(parcel)}`;
}

export async function validateCatastroReferencia(
  referencia: string
): Promise<CatastroValidationResult> {
  const trimmed = referencia.trim();
  if (!trimmed) {
    throw new Error('Indica una referencia catastral');
  }

  const res = await fetch('/.netlify/functions/validateCatastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ referencia: trimmed }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }

  return data as CatastroValidationResult;
}

export interface ImportCatastroFachadaResult {
  base64?: string;
  mimeType?: string;
  foto_destacada_path?: string;
  publicUrl?: string;
}

export async function importCatastroFachada(
  referencia: string,
  propertyId?: string
): Promise<ImportCatastroFachadaResult> {
  const res = await fetch('/.netlify/functions/catastroFachada', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referencia: referencia.trim(),
      ...(propertyId ? { propertyId } : {}),
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Error ${res.status}`);
  }

  return data as ImportCatastroFachadaResult;
}

export function base64ToImageFile(
  base64: string,
  mimeType = 'image/jpeg',
  filename = 'catastro-fachada.jpg'
): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mimeType });
}
