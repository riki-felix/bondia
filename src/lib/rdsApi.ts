import type { RdsPiso } from "./rdsTypes";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Error en la petición");
  }
  return data as T;
}

export async function saveRdsPiso(payload: {
  id?: string | null;
  nombre: string;
  direccion?: string | null;
  fecha_creacion?: string | null;
  delete?: boolean;
}): Promise<{ ok: true; id?: string }> {
  return postJson("/.netlify/functions/rdsPisoSave", payload);
}

export async function saveRdsMovimientos(payload: {
  piso_id: string;
  anio: number;
  meses: { mes: number; gasto: number; ingreso: number }[];
}): Promise<{ ok: true; updated: number }> {
  return postJson("/.netlify/functions/rdsMovimientosSave", payload);
}

export async function saveRdsPromo(payload: {
  anio: number;
  meses: { mes: number; importe: number }[];
}): Promise<{ ok: true; updated: number }> {
  return postJson("/.netlify/functions/rdsPromoSave", payload);
}

export type RdsPisoInput = Pick<RdsPiso, "nombre" | "direccion" | "fecha_creacion">;
