import type { Handler } from "@netlify/functions";
import {
  ensureConfig,
  serviceSupabase,
  json,
  parseBody,
  emptyOrNull,
  toDateOrNull,
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

    const id = emptyOrNull(body.id);
    const isDelete = body.delete === true || body.delete === "true";

    if (isDelete) {
      if (!id) return json({ error: "id requerido para borrar" }, 400);

      const { error: movErr } = await supabase
        .from("rds_movimientos")
        .delete()
        .eq("piso_id", id);
      if (movErr) return json({ error: movErr.message }, 500);

      const { error: pisoErr } = await supabase
        .from("rds_pisos")
        .delete()
        .eq("id", id);
      if (pisoErr) return json({ error: pisoErr.message }, 500);

      return json({ ok: true });
    }

    const nombre = emptyOrNull(body.nombre);
    if (!nombre) return json({ error: "nombre requerido" }, 400);

    const direccion = emptyOrNull(body.direccion);
    const fecha_creacion =
      toDateOrNull(body.fecha_creacion) ?? new Date().toISOString().slice(0, 10);

    if (id) {
      const { error } = await supabase
        .from("rds_pisos")
        .update({ nombre, direccion })
        .eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, id });
    }

    const { data, error } = await supabase
      .from("rds_pisos")
      .insert({ nombre, direccion, fecha_creacion })
      .select("id")
      .single();

    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, id: data.id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error inesperado";
    console.error("[rdsPisoSave] fatal:", e);
    return json({ error: message }, 500);
  }
};
