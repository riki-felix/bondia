import type { Handler } from "@netlify/functions";
import { json, ok, ensureConfig, serviceSupabase } from "./_shared";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return ok();
  if (event.httpMethod !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
	ensureConfig();
	const supabase = serviceSupabase();

	const { data, error } = await supabase
	  .from("propiedades")
	  .select("numero_operacion")
	  .order("numero_operacion", { ascending: false, nullsFirst: false })
	  .limit(1);

	if (error) return json({ error: error.message }, 500);

	const last = data?.[0]?.numero_operacion ?? 0;
	const next = Number(last) + 1;

	return json({ next });
  } catch (e: any) {
	return json({ error: e?.message || String(e) }, 500);
  }
};