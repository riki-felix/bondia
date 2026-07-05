import type { Handler } from "@netlify/functions";
import {
  ensureConfig,
  serviceSupabase,
  json,
  parseBody,
  toMoneyOrNull,
} from "./_shared";

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
    const body = parseBody(event.body);

    const anio = Number(body.anio);
    const meses = Array.isArray(body.meses) ? body.meses : [];

    if (!anio || !Number.isFinite(anio)) return json({ error: "anio inválido" }, 400);

    const rows = meses
      .map((m: Record<string, unknown>) => {
        const mes = Number(m.mes);
        if (!mes || mes < 1 || mes > 12) return null;
        return {
          anio,
          mes,
          importe: toMoneyOrNull(m.importe) ?? 0,
        };
      })
      .filter(Boolean);

    if (!rows.length) return json({ ok: true, updated: 0 });

    const { error } = await supabase
      .from("rds_promo")
      .upsert(rows, { onConflict: "anio,mes" });

    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, updated: rows.length });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error inesperado";
    console.error("[rdsPromoSave] fatal:", e);
    return json({ error: message }, 500);
  }
};
