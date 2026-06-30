// netlify/functions/uploadBrandingLogo.ts
import type { Handler } from "@netlify/functions";
import {
  ensureConfig,
  serviceSupabase,
  json,
  parseBody,
} from "./_shared";

const BRANDING_BUCKET = "bondia-branding";
const BRANDING_ROW_ID = "default";
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/svg+xml",
]);

function extForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/svg+xml") return "svg";
  return "jpg";
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    ensureConfig();
    const body = parseBody(event.body);
    const base64 = body.base64;
    if (!base64 || typeof base64 !== "string") {
      return json({ error: "base64 requerido" }, 400);
    }

    const mimeType =
      typeof body.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
    if (!ALLOWED_MIME.has(mimeType)) {
      return json({ error: "Formato no permitido (JPG, PNG o SVG)" }, 400);
    }

    const buffer = Buffer.from(base64, "base64");
    if (buffer.length === 0) return json({ error: "Archivo vacío" }, 400);
    if (buffer.length > 2 * 1024 * 1024) {
      return json({ error: "El logo no puede superar 2 MB" }, 400);
    }

    const supabase = serviceSupabase();
    const { data: current, error: readError } = await supabase
      .from("bondia_branding")
      .select("logo_storage_path")
      .eq("id", BRANDING_ROW_ID)
      .maybeSingle();

    if (readError) return json({ error: readError.message }, 500);

    const ext = extForMime(mimeType);
    const storagePath = `logo/logo.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BRANDING_BUCKET)
      .upload(storagePath, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error("[uploadBrandingLogo]", uploadError);
      return json({ error: uploadError.message }, 500);
    }

    const updatedAt = new Date().toISOString();
    const { data: saved, error: saveError } = await supabase
      .from("bondia_branding")
      .update({
        logo_storage_path: storagePath,
        logo_mime_type: mimeType,
        updated_at: updatedAt,
      })
      .eq("id", BRANDING_ROW_ID)
      .select("logo_storage_path, logo_mime_type, updated_at")
      .single();

    if (saveError) {
      return json({ error: saveError.message }, 500);
    }

    const oldPath = current?.logo_storage_path;
    if (oldPath && oldPath !== storagePath) {
      await supabase.storage.from(BRANDING_BUCKET).remove([oldPath]);
    }

    const { data: urlData } = supabase.storage
      .from(BRANDING_BUCKET)
      .getPublicUrl(saved.logo_storage_path);

    const logoUrl = `${urlData.publicUrl}?v=${new Date(saved.updated_at).getTime()}`;

    return json({
      logoUrl,
      mimeType: saved.logo_mime_type,
      updatedAt: saved.updated_at,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error inesperado";
    console.error("[uploadBrandingLogo] fatal:", e);
    return json({ error: message }, 500);
  }
};
