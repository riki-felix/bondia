// netlify/functions/removeBrandingLogo.ts
import type { Handler } from "@netlify/functions";
import { ensureConfig, serviceSupabase, json } from "./_shared";

const BRANDING_BUCKET = "bondia-branding";
const BRANDING_ROW_ID = "default";

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
    const supabase = serviceSupabase();

    const { data: current, error: readError } = await supabase
      .from("bondia_branding")
      .select("logo_storage_path")
      .eq("id", BRANDING_ROW_ID)
      .maybeSingle();

    if (readError) return json({ error: readError.message }, 500);

    if (current?.logo_storage_path) {
      await supabase.storage
        .from(BRANDING_BUCKET)
        .remove([current.logo_storage_path]);
    }

    const { error: updateError } = await supabase
      .from("bondia_branding")
      .update({
        logo_storage_path: null,
        logo_mime_type: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", BRANDING_ROW_ID);

    if (updateError) return json({ error: updateError.message }, 500);

    return json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error inesperado";
    console.error("[removeBrandingLogo] fatal:", e);
    return json({ error: message }, 500);
  }
};
