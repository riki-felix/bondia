// netlify/functions/upsertSanyusModelo184Config.ts
import type { Handler } from "@netlify/functions";
import { ensureConfig, serviceSupabase, json, emptyOrNull, wrapHandler } from "./_shared";

export async function handleUpsertModelo184Config(body: Record<string, unknown>) {
  ensureConfig();
  const supabase = serviceSupabase();

  const row = {
    id: "default",
    tipo_entidad: "comunidad_bienes",
    nif: (emptyOrNull(body.nif) ?? "").trim(),
    denominacion: (emptyOrNull(body.denominacion) ?? "Sanyus CB").trim(),
    domicilio: (emptyOrNull(body.domicilio) ?? "").trim(),
    municipio: (emptyOrNull(body.municipio) ?? "").trim(),
    provincia: (emptyOrNull(body.provincia) ?? "").trim(),
    codigo_postal: (emptyOrNull(body.codigo_postal) ?? "").trim(),
    carlos_nif: (emptyOrNull(body.carlos_nif) ?? "").trim(),
    laura_nif: (emptyOrNull(body.laura_nif) ?? "").trim(),
    izan_nif: (emptyOrNull(body.izan_nif) ?? "").trim(),
    notas: emptyOrNull(body.notas),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("sanyus_modelo184_config")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export const handler: Handler = wrapHandler(
  (body) => handleUpsertModelo184Config(body),
  "upsertSanyusModelo184Config"
);
