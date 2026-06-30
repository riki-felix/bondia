import { fileToBase64 } from "./propertyImageUpload";
import type { BrandingState } from "./branding";

export async function uploadBrandingLogo(file: File): Promise<BrandingState> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/.netlify/functions/uploadBrandingLogo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base64,
      mimeType: file.type,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Error al subir el logo"
    );
  }
  return {
    logoUrl: typeof data.logoUrl === "string" ? data.logoUrl : null,
    mimeType: typeof data.mimeType === "string" ? data.mimeType : null,
    updatedAt: typeof data.updatedAt === "string" ? data.updatedAt : null,
  };
}

export async function removeBrandingLogo(): Promise<void> {
  const res = await fetch("/.netlify/functions/removeBrandingLogo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Error al quitar el logo"
    );
  }
}
