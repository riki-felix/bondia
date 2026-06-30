import type { SupabaseClient } from "@supabase/supabase-js";

export const BRANDING_BUCKET = "bondia-branding";
export const BRANDING_ROW_ID = "default";

export const ALLOWED_LOGO_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/svg+xml",
] as const;

export type AllowedLogoMimeType = (typeof ALLOWED_LOGO_MIME_TYPES)[number];

export const LOGO_FILE_ACCEPT = ".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml";

export interface BrandingConfig {
  logo_storage_path: string | null;
  logo_mime_type: string | null;
  updated_at: string | null;
}

export interface BrandingState {
  logoUrl: string | null;
  mimeType: string | null;
  updatedAt: string | null;
}

export function isAllowedLogoMimeType(
  mime: string | null | undefined
): mime is AllowedLogoMimeType {
  return (
    mime != null &&
    (ALLOWED_LOGO_MIME_TYPES as readonly string[]).includes(mime)
  );
}

export function logoExtensionForMime(mime: AllowedLogoMimeType): string {
  if (mime === "image/png") return "png";
  if (mime === "image/svg+xml") return "svg";
  return "jpg";
}

export function brandingLogoPublicUrl(
  supabase: SupabaseClient,
  row: BrandingConfig | null | undefined
): string | null {
  if (!row?.logo_storage_path) return null;
  const { data } = supabase.storage
    .from(BRANDING_BUCKET)
    .getPublicUrl(row.logo_storage_path);
  const base = data.publicUrl;
  if (row.updated_at) {
    return `${base}?v=${new Date(row.updated_at).getTime()}`;
  }
  return base;
}

export function brandingStateFromRow(
  supabase: SupabaseClient,
  row: BrandingConfig | null | undefined
): BrandingState {
  return {
    logoUrl: brandingLogoPublicUrl(supabase, row),
    mimeType: row?.logo_mime_type ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}
