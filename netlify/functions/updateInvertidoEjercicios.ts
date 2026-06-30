// netlify/functions/updateInvertidoEjercicios.ts
import type { Handler } from "@netlify/functions";
import {
  ensureConfig,
  serviceSupabase,
  json,
  toMoneyOrNull,
  wrapHandler,
} from "./_shared";

function parseByYear(body: Record<string, unknown>): Record<number, number> {
  const raw = body.byYear;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("byYear requerido");
  }

  const out: Record<number, number> = {};
  for (const [yearKey, value] of Object.entries(raw)) {
    const ejercicio = Number(yearKey);
    if (!Number.isFinite(ejercicio) || ejercicio < 1000 || ejercicio > 2100) {
      continue;
    }
    const importe = toMoneyOrNull(value);
    if (importe != null && importe > 0) {
      out[ejercicio] = importe;
    }
  }
  return out;
}

export async function handleUpdateInvertidoEjercicios(
  body: Record<string, unknown>
) {
  ensureConfig();
  const supabase = serviceSupabase();

  let byYear: Record<number, number>;
  try {
    byYear = parseByYear(body);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "byYear inválido" },
      400
    );
  }

  const ejercicios = Object.keys(byYear).map(Number);

  if (ejercicios.length === 0) {
    const { error: delError } = await supabase
      .from("bondia_invertido_ejercicio")
      .delete()
      .gte("ejercicio", 1000);
    if (delError) return json({ error: delError.message }, 500);
    return json({ byYear: {} });
  }

  const { error: delError } = await supabase
    .from("bondia_invertido_ejercicio")
    .delete()
    .not("ejercicio", "in", `(${ejercicios.join(",")})`);
  if (delError) return json({ error: delError.message }, 500);

  const now = new Date().toISOString();
  const rows = ejercicios.map((ejercicio) => ({
    ejercicio,
    importe: byYear[ejercicio],
    updated_at: now,
  }));

  const { error: upsertError } = await supabase
    .from("bondia_invertido_ejercicio")
    .upsert(rows, { onConflict: "ejercicio" });
  if (upsertError) return json({ error: upsertError.message }, 500);

  const response: Record<string, number> = {};
  for (const [ejercicio, importe] of Object.entries(byYear)) {
    response[String(ejercicio)] = importe;
  }
  return json({ byYear: response });
}

export const handler: Handler = wrapHandler(
  (body) => handleUpdateInvertidoEjercicios(body),
  "updateInvertidoEjercicios"
);
