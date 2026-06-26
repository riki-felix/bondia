// netlify/functions/updateObjetivo.ts
import type { Handler } from "@netlify/functions";
import {
  ensureConfig,
  serviceSupabase,
  json,
  emptyOrNull,
  toMoneyOrNull,
  wrapHandler,
} from "./_shared";

const ALLOWED_IDS = new Set<string>(["beneficio_medio_operacion"]);

export async function handleUpdateObjetivo(body: Record<string, unknown>) {
  ensureConfig();
  const supabase = serviceSupabase();

  const id = emptyOrNull(body.id);
  if (!id) return json({ error: "id requerido" }, 400);
  if (!ALLOWED_IDS.has(id)) return json({ error: "Objetivo no permitido" }, 400);
  if (body.valor === undefined) return json({ error: "valor requerido" }, 400);

  const valor =
    body.valor == null || body.valor === ""
      ? null
      : toMoneyOrNull(body.valor);

  const { data, error } = await supabase
    .from("bondia_objetivos")
    .update({
      valor,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, etiqueta, valor")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
}

export const handler: Handler = wrapHandler(
  (body) => handleUpdateObjetivo(body),
  "updateObjetivo"
);
